using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Win32;

namespace PrismLab
{
    internal static class Program
    {
        private const string AppMutexName = @"Local\PrismLab_Portable_v3";
        private static Mutex appMutex;
        private static NotifyIcon tray;
        private static AssetServer server;
        private static string dataDir;
        private static string portFile;
        private static Form shell;
        private static bool exiting;

        [STAThread]
        private static void Main(string[] args)
        {
            bool noBrowser = HasArg(args, "--no-browser") ||
                string.Equals(Environment.GetEnvironmentVariable("PRISM_NO_BROWSER"), "1", StringComparison.Ordinal);

            dataDir = ResolveDataDir();
            portFile = Path.Combine(dataDir, "port-v3.txt");
            Log("Starting Prism portable");
            BootstrapWebView2();

            bool createdNew;
            appMutex = new Mutex(true, AppMutexName, out createdNew);
            if (!createdNew)
            {
                ActivateExistingWindow();
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.ThreadException += delegate(object sender, ThreadExceptionEventArgs e) { Log("ThreadException: " + e.Exception); };
            AppDomain.CurrentDomain.UnhandledException += delegate(object sender, UnhandledExceptionEventArgs e) { Log("Unhandled: " + e.ExceptionObject); };

            try
            {
                server = new AssetServer();
                server.Start();
                File.WriteAllText(portFile, server.Port.ToString(), Encoding.ASCII);
                Log("Server started at " + server.Url);

                BuildTray();
                if (noBrowser)
                {
                    Application.Run(new ApplicationContext());
                }
                else
                {
                    shell = CreateShell();
                    Application.Run(shell);
                }
            }
            catch (Exception ex)
            {
                Log("Fatal: " + ex);
                MessageBox.Show(
                    "中山市中山纪念中学物理实验室启动失败。\r\n\r\n" + ex.Message,
                    "中山市中山纪念中学物理实验室",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
            finally
            {
                Log("Main exiting");
                Cleanup();
            }
        }

        private static bool HasArg(string[] args, string value)
        {
            if (args == null) return false;
            for (int i = 0; i < args.Length; i++)
            {
                if (string.Equals(args[i], value, StringComparison.OrdinalIgnoreCase)) return true;
            }
            return false;
        }

        private static void BootstrapWebView2()
        {
            string dir = Path.Combine(dataDir, "webview2-runtime");
            Directory.CreateDirectory(dir);
            string[] resources = new string[] {
                "PrismLab.WebView2.Core.dll",
                "PrismLab.WebView2.WinForms.dll",
                "PrismLab.WebView2Loader.dll"
            };
            foreach (string name in resources)
            {
                string target = Path.Combine(dir, name.Replace("PrismLab.WebView2Loader.dll", "WebView2Loader.dll").Replace("PrismLab.WebView2.", "Microsoft.Web.WebView2."));
                using (Stream stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(name))
                {
                    if (stream == null) throw new InvalidOperationException("Missing embedded WebView2 resource: " + name);
                    using (FileStream output = new FileStream(target, FileMode.Create, FileAccess.Write, FileShare.Read))
                    {
                        stream.CopyTo(output);
                    }
                }
            }
            SetDllDirectory(dir);
            AppDomain.CurrentDomain.AssemblyResolve += delegate(object sender, ResolveEventArgs args)
            {
                string simple = new AssemblyName(args.Name).Name;
                string candidate = Path.Combine(dir, simple + ".dll");
                return File.Exists(candidate) ? Assembly.Load(File.ReadAllBytes(candidate)) : null;
            };
        }

        private static Form CreateShell()
        {
            Form form = new Form();
            form.Text = "中山市中山纪念中学物理实验室";
            form.StartPosition = FormStartPosition.CenterScreen;
            form.MinimumSize = new Size(1120, 720);
            form.ClientSize = new Size(1500, 940);
            form.BackColor = Color.FromArgb(10, 15, 24);
            try { form.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); }
            catch { }

            WebView2 view = new WebView2();
            view.Dock = DockStyle.Fill;
            view.DefaultBackgroundColor = Color.FromArgb(10, 15, 24);
            form.Controls.Add(view);

            form.Shown += async delegate
            {
                Log("Form shown");
                try
                {
                    string webData = Path.Combine(dataDir, "webview2");
                    Directory.CreateDirectory(webData);
                    CoreWebView2Environment environment = await CoreWebView2Environment.CreateAsync(null, webData, null);
                    await view.EnsureCoreWebView2Async(environment);
                    view.CoreWebView2.Settings.AreDevToolsEnabled = false;
                    view.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
                    view.CoreWebView2.Settings.IsStatusBarEnabled = false;
                    view.CoreWebView2.Settings.IsZoomControlEnabled = false;
                    view.CoreWebView2.Settings.AreBrowserAcceleratorKeysEnabled = true;
                    view.CoreWebView2.NewWindowRequested += delegate(object sender, CoreWebView2NewWindowRequestedEventArgs e)
                    {
                        e.Handled = true;
                        try { Process.Start(new ProcessStartInfo(e.Uri) { UseShellExecute = true }); }
                        catch { }
                    };
                    view.CoreWebView2.Navigate(server.Url);
                    form.Show();
                    form.Activate();
                }
                catch (Exception ex)
                {
                    Log("WebView2 failed: " + ex);
                    MessageBox.Show(
                        "内置桌面引擎启动失败。\r\n\r\n请确认系统已安装 Microsoft Edge WebView2 Runtime。\r\n\r\n" + ex.Message,
                        "中山市中山纪念中学物理实验室",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error);
                    exiting = true;
                    form.Close();
                }
            };
            form.FormClosing += delegate(object sender, FormClosingEventArgs e)
            {
                exiting = true;
                Log("FormClosing: " + e.CloseReason);
            };
            System.Windows.Forms.Timer activateTimer = new System.Windows.Forms.Timer();
            activateTimer.Interval = 900;
            activateTimer.Tick += delegate
            {
                activateTimer.Stop();
                if (form.IsDisposed) return;
                if (!form.Visible) form.Show();
                if (form.WindowState == FormWindowState.Minimized) form.WindowState = FormWindowState.Normal;
                form.Activate();
                form.BringToFront();
            };
            activateTimer.Start();
            return form;
        }

        private static void ShowShell()
        {
            if (shell == null || shell.IsDisposed) return;
            if (!shell.Visible) shell.Show();
            if (shell.WindowState == FormWindowState.Minimized) shell.WindowState = FormWindowState.Normal;
            shell.Activate();
            shell.BringToFront();
        }

        private static void ActivateExistingWindow()
        {
            IntPtr hwnd = FindWindow(null, "中山市中山纪念中学物理实验室");
            if (hwnd != IntPtr.Zero)
            {
                ShowWindowAsync(hwnd, 9);
                SetForegroundWindow(hwnd);
            }
        }

        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern bool SetDllDirectory(string lpPathName);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [DllImport("user32.dll")]
        private static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);

        private static string ResolveDataDir()
        {
            string exeDir = Path.GetDirectoryName(Application.ExecutablePath);
            string[] candidates = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PrismLab"),
                Path.Combine(exeDir, "PrismLabData"),
                Path.Combine(Path.GetTempPath(), "PrismLab")
            };

            Exception last = null;
            for (int i = 0; i < candidates.Length; i++)
            {
                try
                {
                    Directory.CreateDirectory(candidates[i]);
                    string probe = Path.Combine(candidates[i], ".write-test");
                    File.WriteAllText(probe, "ok", Encoding.ASCII);
                    File.Delete(probe);
                    return candidates[i];
                }
                catch (Exception ex)
                {
                    last = ex;
                }
            }

            throw new InvalidOperationException("没有可写的用户数据目录。", last);
        }

        private static void Log(string message)
        {
            try
            {
                if (string.IsNullOrEmpty(dataDir)) return;
                File.AppendAllText(
                    Path.Combine(dataDir, "launcher.log"),
                    DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "  " + message + "\r\n",
                    Encoding.UTF8);
            }
            catch
            {
            }
        }

        private static int ReadPort()
        {
            try
            {
                if (!File.Exists(portFile)) return 0;
                int port;
                if (int.TryParse(File.ReadAllText(portFile).Trim(), out port)) return port;
            }
            catch
            {
            }
            return 0;
        }

        private static void BuildTray()
        {
            tray = new NotifyIcon();
            try
            {
                tray.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            }
            catch
            {
            }
            if (tray.Icon == null) tray.Icon = SystemIcons.Application;

            tray.Text = "中山市中山纪念中学物理实验室 v" + Assembly.GetExecutingAssembly().GetName().Version.ToString(3);
            tray.Visible = true;

            ContextMenuStrip menu = new ContextMenuStrip();
            ToolStripMenuItem open = new ToolStripMenuItem("打开实验室");
            open.Click += delegate { ShowShell(); };
            ToolStripMenuItem copy = new ToolStripMenuItem("复制访问地址");
            copy.Click += delegate
            {
                try { Clipboard.SetText(server.Url); }
                catch { }
            };
            ToolStripMenuItem exit = new ToolStripMenuItem("退出");
            exit.Click += delegate { exiting = true; if (shell != null && !shell.IsDisposed) shell.Close(); Application.Exit(); };
            menu.Items.Add(open);
            menu.Items.Add(copy);
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add(exit);
            tray.ContextMenuStrip = menu;
            tray.DoubleClick += delegate { ShowShell(); };
            try
            {
                tray.ShowBalloonTip(3500, "中山市中山纪念中学物理实验室已启动",
                    "如果浏览器没有自动打开，请右键托盘图标选择“打开实验室”。",
                    ToolTipIcon.Info);
            }
            catch
            {
            }
        }

        private static void Cleanup()
        {
            try
            {
                if (server != null) server.Stop();
            }
            catch
            {
            }

            try
            {
                if (tray != null)
                {
                    tray.Visible = false;
                    tray.Dispose();
                    tray = null;
                }
            }
            catch
            {
            }

            try
            {
                if (File.Exists(portFile)) File.Delete(portFile);
            }
            catch
            {
            }

            try
            {
                if (appMutex != null)
                {
                    appMutex.ReleaseMutex();
                    appMutex.Dispose();
                    appMutex = null;
                }
            }
            catch
            {
            }
        }

        private static void OpenBrowser(string url)
        {
            Log("OpenBrowser " + url);
            string[] candidates = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe")
            };

            for (int i = 0; i < candidates.Length; i++)
            {
                if (!File.Exists(candidates[i])) continue;
                try
                {
                    Log("Trying browser " + candidates[i]);
                    string browserName = Path.GetFileNameWithoutExtension(candidates[i]);
                    string profileDir = Path.Combine(dataDir, "browser", browserName);
                    Directory.CreateDirectory(profileDir);
                    ProcessStartInfo info = new ProcessStartInfo();
                    info.FileName = candidates[i];
                    info.Arguments = "--app=\"" + url + "\" --window-size=1500,980 " +
                        "--no-first-run --no-default-browser-check --disable-session-crashed-bubble " +
                        "--disable-features=Translate,MediaRouter " +
                        "--user-data-dir=\"" + profileDir + "\"";
                    info.UseShellExecute = true;
                    info.WorkingDirectory = Path.GetDirectoryName(candidates[i]);
                    Process started = Process.Start(info);
                    Log("Browser launch requested" + (started == null ? " (no process handle)" : " pid " + started.Id));
                    // Chrome/Edge hand off --app windows to an existing browser
                    // process and can exit with a non-zero code immediately.
                    // Do not block the launcher. If the app process really
                    // fails, fall back to the default browser on a worker.
                    if (started != null)
                    {
                        Process watched = started;
                        Thread watcher = new Thread(delegate()
                        {
                            try
                            {
                                if (watched.WaitForExit(2600) && watched.ExitCode != 0)
                                {
                                    Log("Browser exited with code " + watched.ExitCode + ", opening normal window");
                                    OpenNormalBrowser(url);
                                }
                            }
                            catch
                            {
                            }
                        });
                        watcher.IsBackground = true;
                        watcher.Start();
                    }
                    return;
                }
                catch (Exception ex)
                {
                    Log("Browser failed: " + ex.Message);
                }
            }

            OpenNormalBrowser(url);
        }

        private static void OpenNormalBrowser(string url)
        {
            string[] candidates = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe")
            };
            for (int i = 0; i < candidates.Length; i++)
            {
                if (!File.Exists(candidates[i])) continue;
                try
                {
                    string browserName = Path.GetFileNameWithoutExtension(candidates[i]);
                    string profileDir = Path.Combine(dataDir, "browser", browserName + "-window");
                    Directory.CreateDirectory(profileDir);
                    ProcessStartInfo info = new ProcessStartInfo();
                    info.FileName = candidates[i];
                    info.Arguments = "--new-window \"" + url + "\" --no-first-run " +
                        "--no-default-browser-check --disable-session-crashed-bubble " +
                        "--disable-features=Translate,MediaRouter " +
                        "--user-data-dir=\"" + profileDir + "\"";
                    info.UseShellExecute = true;
                    info.WorkingDirectory = Path.GetDirectoryName(candidates[i]);
                    Process started = Process.Start(info);
                    Log("Normal browser window requested: " + candidates[i] +
                        (started == null ? " (no process handle)" : " pid " + started.Id));
                    if (started != null)
                    {
                        Process watched = started;
                        Thread watcher = new Thread(delegate()
                        {
                            try
                            {
                                if (watched.WaitForExit(2600) && watched.ExitCode != 0)
                                {
                                    Log("Normal browser exited with code " + watched.ExitCode);
                                    OpenDefaultBrowser(url);
                                }
                            }
                            catch
                            {
                            }
                        });
                        watcher.IsBackground = true;
                        watcher.Start();
                    }
                    return;
                }
                catch (Exception ex)
                {
                    Log("Normal browser failed: " + ex.Message);
                }
            }
            OpenDefaultBrowser(url);
        }

        private static void OpenDefaultBrowser(string url)
        {
            try
            {
                Log("Falling back to default browser");
                ProcessStartInfo fallback = new ProcessStartInfo(url);
                fallback.UseShellExecute = true;
                Process.Start(fallback);
            }
            catch (Exception ex)
            {
                Log("Fallback failed: " + ex.Message);
                MessageBox.Show(
                    "无法自动打开浏览器，请手动访问：\r\n" + url + "\r\n\r\n" + ex.Message,
                    "中山市中山纪念中学物理实验室",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
            }
        }
    }

    internal sealed class AssetServer
    {
        private readonly Dictionary<string, byte[]> assets = new Dictionary<string, byte[]>(StringComparer.OrdinalIgnoreCase);
        private TcpListener listener;
        private Thread thread;
        private volatile bool running;

        public int Port { get; private set; }
        public string Url { get { return "http://127.0.0.1:" + Port + "/"; } }

        public AssetServer()
        {
            LoadAssets();
        }

        private void LoadAssets()
        {
            Assembly assembly = Assembly.GetExecutingAssembly();
            Stream resource = assembly.GetManifestResourceStream("PrismLab.app.zip");
            if (resource == null) throw new InvalidOperationException("内置应用资源缺失。");

            using (resource)
            using (ZipArchive archive = new ZipArchive(resource, ZipArchiveMode.Read))
            {
                foreach (ZipArchiveEntry entry in archive.Entries)
                {
                    string name = entry.FullName.Replace('\\', '/').TrimStart('/');
                    if (name.Length == 0 || name.EndsWith("/", StringComparison.Ordinal)) continue;

                    using (Stream input = entry.Open())
                    using (MemoryStream buffer = new MemoryStream())
                    {
                        input.CopyTo(buffer);
                        assets[name] = buffer.ToArray();
                    }
                }
            }

            if (!assets.ContainsKey("index.html"))
            {
                throw new InvalidOperationException("内置应用缺少 index.html。");
            }
        }

        public void Start()
        {
            for (int port = 4380; port <= 4392; port++)
            {
                try
                {
                    TcpListener candidate = new TcpListener(IPAddress.Loopback, port);
                    candidate.Start();
                    listener = candidate;
                    Port = port;
                    break;
                }
                catch (SocketException)
                {
                }
            }

            if (listener == null) throw new InvalidOperationException("无法在 4380–4392 之间启动本地服务。");

            running = true;
            thread = new Thread(ServeLoop);
            thread.IsBackground = true;
            thread.Name = "Prism asset server";
            thread.Start();
        }

        public void Stop()
        {
            running = false;
            try
            {
                liveWindow = IntPtr.Zero;
                lock (liveFrameLock) { liveFrame = null; }
                CloseAllWallpaperWindows();
            }
            catch
            {
            }
            try
            {
                if (listener != null) listener.Stop();
            }
            catch
            {
            }
            try
            {
                if (thread != null) thread.Join(600);
            }
            catch
            {
            }
        }

        private void ServeLoop()
        {
            while (running)
            {
                TcpClient client = null;
                try
                {
                    client = listener.AcceptTcpClient();
                    TcpClient accepted = client;
                    client = null;
                    Thread worker = new Thread(delegate()
                    {
                        try { HandleClient(accepted); }
                        catch { }
                        finally
                        {
                            try { accepted.Close(); }
                            catch { }
                        }
                    });
                    worker.IsBackground = true;
                    worker.Name = "Prism request";
                    worker.Start();
                }
                catch (SocketException)
                {
                }
                catch (ObjectDisposedException)
                {
                    break;
                }
                catch
                {
                }
                finally
                {
                    if (client != null)
                    {
                        try { client.Close(); }
                        catch { }
                    }
                }
            }
        }

        private void HandleClient(TcpClient client)
        {
            client.NoDelay = true;
            client.ReceiveTimeout = 5000;
            client.SendTimeout = 5000;
            NetworkStream stream = client.GetStream();
            StreamReader reader = new StreamReader(stream, Encoding.ASCII, false, 2048, true);

            string requestLine = reader.ReadLine();
            if (string.IsNullOrEmpty(requestLine)) return;

            string line;
            do
            {
                line = reader.ReadLine();
            }
            while (!string.IsNullOrEmpty(line));

            string[] parts = requestLine.Split(' ');
            if (parts.Length < 2 || !string.Equals(parts[0], "GET", StringComparison.OrdinalIgnoreCase))
            {
                WriteResponse(stream, 405, "Method Not Allowed", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("Method Not Allowed"));
                return;
            }

            string rawPath = parts[1].Split('?')[0];
            string query = "";
            int question = parts[1].IndexOf('?');
            if (question >= 0) query = parts[1].Substring(question + 1);
            string decoded;
            try
            {
                decoded = Uri.UnescapeDataString(rawPath);
            }
            catch
            {
                decoded = "/";
            }
            if (decoded == "/") decoded = "/index.html";
            if (decoded.StartsWith("/api/wallpaper-engine/", StringComparison.OrdinalIgnoreCase))
            {
                HandleWallpaperEngine(stream, decoded, query);
                return;
            }

            string key = decoded.TrimStart('/').Replace('\\', '/');
            byte[] body;
            if (!assets.TryGetValue(key, out body))
            {
                WriteResponse(stream, 404, "Not Found", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("Not Found"));
                return;
            }

            string type = ContentType(key);
            string cache = (key.EndsWith(".html", StringComparison.OrdinalIgnoreCase) ||
                key.EndsWith(".js", StringComparison.OrdinalIgnoreCase) ||
                key.EndsWith(".css", StringComparison.OrdinalIgnoreCase))
                ? "no-cache"
                : "public, max-age=86400";
            WriteResponse(stream, 200, "OK", type, body, cache);
        }

        private void HandleWallpaperEngine(NetworkStream stream, string path, string query)
        {
            if (path.EndsWith("/health", StringComparison.OrdinalIgnoreCase))
            {
                WriteJson(stream, new Dictionary<string, object> {
                    { "ok", true }, { "service", "prism-wallpaper-engine" }, { "version", "1.0" },
                    { "pump", livePump != null && livePump.IsAlive }, { "frame", liveFrame == null ? 0 : liveFrame.Length },
                    { "window", liveWindow.ToInt64() }
                });
                return;
            }

            if (path.EndsWith("/testcapture", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    Dictionary<string, object> current = ReadCurrentWallpaper();
                    string project = current == null ? "" : Str(current, "project");
                    IntPtr hwnd = string.IsNullOrEmpty(project) ? IntPtr.Zero : EnsureWallpaperWindow(project);
                    byte[] jpeg = hwnd == IntPtr.Zero ? null : CaptureWindowJpeg(hwnd);
                    int loopCount = 0;
                    long loopMs = 0;
                    if (hwnd != IntPtr.Zero)
                    {
                        System.Diagnostics.Stopwatch watch = System.Diagnostics.Stopwatch.StartNew();
                        for (int i = 0; i < 8; i++)
                        {
                            byte[] frame = CaptureWindowJpeg(hwnd);
                            if (frame == null || frame.Length == 0) break;
                            loopCount++;
                        }
                        loopMs = watch.ElapsedMilliseconds;
                    }
                    int weBytes = -1;
                    string weError = "";
                    if (hwnd != IntPtr.Zero)
                    {
                        try
                        {
                            using (WeCapture capture = new WeCapture(hwnd))
                            {
                                byte[] weJpeg = capture.Grab();
                                weBytes = weJpeg == null ? 0 : weJpeg.Length;
                            }
                        }
                        catch (Exception weEx) { weError = weEx.ToString(); }
                    }
                    WriteJson(stream, new Dictionary<string, object> {
                        { "ok", jpeg != null && jpeg.Length > 0 }, { "hwnd", hwnd.ToInt64() },
                        { "bytes", jpeg == null ? 0 : jpeg.Length }, { "weBytes", weBytes },
                        { "loopCount", loopCount }, { "loopMs", loopMs }, { "weError", weError }, { "temp", Path.GetTempPath() }
                    });
                }
                catch (Exception ex)
                {
                    WriteJson(stream, new Dictionary<string, object> { { "ok", false }, { "error", ex.ToString() } });
                }
                return;
            }

            if (path.EndsWith("/frame", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    IntPtr hwnd = liveWindow;
                    if (hwnd == IntPtr.Zero || !IsWindow(hwnd))
                    {
                        Dictionary<string, object> current = ReadCurrentWallpaper();
                        string project = current == null ? "" : Str(current, "project");
                        hwnd = string.IsNullOrEmpty(project) ? IntPtr.Zero : EnsureWallpaperWindow(project);
                        liveWindow = hwnd;
                    }
                    if (hwnd != IntPtr.Zero) EnsureLivePump();
                    byte[] jpeg = WaitForLiveFrame(800);
                    if (jpeg == null && hwnd != IntPtr.Zero) jpeg = CaptureWindowJpeg(hwnd);
                    if (jpeg == null || jpeg.Length == 0)
                    {
                        liveWindow = IntPtr.Zero;
                        WriteResponse(stream, 503, "Service Unavailable", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("Wallpaper Engine frame unavailable"));
                    }
                    else
                    {
                        WriteResponse(stream, 200, "OK", "image/jpeg", jpeg, "no-store");
                    }
                }
                catch (Exception ex)
                {
                    WriteResponse(stream, 500, "Internal Server Error", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes(ex.Message));
                }
                return;
            }

            if (path.EndsWith("/live", StringComparison.OrdinalIgnoreCase))
            {
                HandleWallpaperLive(stream);
                return;
            }

            if (path.EndsWith("/file", StringComparison.OrdinalIgnoreCase))
            {
                string raw = QueryValue(query, "path");
                if (string.IsNullOrEmpty(raw))
                {
                    WriteResponse(stream, 400, "Bad Request", "application/json; charset=utf-8", Encoding.UTF8.GetBytes("{\"ok\":false,\"error\":\"path required\"}"));
                    return;
                }
                string filePath;
                try { filePath = Path.GetFullPath(Uri.UnescapeDataString(raw)); }
                catch { filePath = ""; }
                if (string.IsNullOrEmpty(filePath) || !File.Exists(filePath) || !IsAllowedWallpaperPath(filePath))
                {
                    WriteResponse(stream, 404, "Not Found", "application/json; charset=utf-8", Encoding.UTF8.GetBytes("{\"ok\":false,\"error\":\"not found\"}"));
                    return;
                }
                try
                {
                    byte[] data = File.ReadAllBytes(filePath);
                    WriteResponse(stream, 200, "OK", ContentType(filePath), data);
                }
                catch (Exception ex)
                {
                    WriteJson(stream, new Dictionary<string, object> { { "ok", false }, { "error", ex.Message } });
                }
                return;
            }

            if (path.EndsWith("/current", StringComparison.OrdinalIgnoreCase))
            {
                try
                {
                    Dictionary<string, object> current = ReadCurrentWallpaper();
                    if (current == null)
                    {
                        WriteJson(stream, new Dictionary<string, object> { { "ok", false }, { "error", "未找到 Wallpaper Engine 当前壁纸。请确认软件已安装并选择过壁纸。" } });
                    }
                    else
                    {
                        WriteJson(stream, new Dictionary<string, object> { { "ok", true }, { "current", current } });
                    }
                }
                catch (Exception ex)
                {
                    WriteJson(stream, new Dictionary<string, object> { { "ok", false }, { "error", ex.Message } });
                }
                return;
            }

            WriteResponse(stream, 404, "Not Found", "application/json; charset=utf-8", Encoding.UTF8.GetBytes("{\"ok\":false,\"error\":\"unknown endpoint\"}"));
        }

        private void HandleWallpaperLive(NetworkStream stream)
        {
            LiveLog("live request");
            Dictionary<string, object> current = ReadCurrentWallpaper();
            if (current == null)
            {
                WriteResponse(stream, 503, "Service Unavailable", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("Wallpaper Engine current wallpaper unavailable"));
                return;
            }
            string kind = Str(current, "kind");
            string project = Str(current, "project");
            if ((kind != "scene" && kind != "web") || string.IsNullOrEmpty(project))
            {
                WriteResponse(stream, 409, "Conflict", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("Current wallpaper has no live scene"));
                return;
            }

            IntPtr hwnd = EnsureWallpaperWindow(project);
            LiveLog("window " + hwnd);
            if (hwnd == IntPtr.Zero)
            {
                WriteResponse(stream, 503, "Service Unavailable", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("Wallpaper Engine live window unavailable"));
                return;
            }

            string header = "HTTP/1.1 200 OK\r\n" +
                "Content-Type: multipart/x-mixed-replace; boundary=frame\r\n" +
                "Cache-Control: no-store\r\n" +
                "Connection: close\r\n\r\n";
            byte[] headerBytes = Encoding.ASCII.GetBytes(header);
            stream.Write(headerBytes, 0, headerBytes.Length);
            stream.Flush();
            WeCapture capture = null;
            try
            {
                while (running)
                {
                    byte[] jpeg = CaptureWindowJpeg(hwnd);
                    if (jpeg == null || jpeg.Length == 0) break;
                    string frameHeader = "--frame\r\nContent-Type: image/jpeg\r\nContent-Length: " + jpeg.Length + "\r\n\r\n";
                    byte[] fh = Encoding.ASCII.GetBytes(frameHeader);
                    stream.Write(fh, 0, fh.Length);
                    stream.Write(jpeg, 0, jpeg.Length);
                    stream.WriteByte(13);
                    stream.WriteByte(10);
                    stream.Flush();
                    Thread.Sleep(33);
                }
            }
            catch (Exception ex)
            {
                LiveLog(ex.ToString());
            }
            finally
            {
                if (capture != null) capture.Dispose();
            }
        }

        private static string liveProject = "";
        private static IntPtr liveWindow = IntPtr.Zero;
        private static Thread livePump = null;
        private static byte[] liveFrame = null;
        private static readonly object liveFrameLock = new object();
        private static readonly string LiveWindowTitle = "PrismWE-" + Process.GetCurrentProcess().Id;
        private static readonly object liveLock = new object();

        private static IntPtr EnsureWallpaperWindow(string project)
        {
            lock (liveLock)
            {
                IntPtr hwnd = FindWallpaperWindow();
                if (hwnd != IntPtr.Zero && liveProject == project)
                {
                    liveWindow = hwnd;
                    HideWallpaperWindow(hwnd);
                    return hwnd;
                }
                if (hwnd != IntPtr.Zero)
                {
                    CloseAllWallpaperWindows();
                    Thread.Sleep(300);
                }

                string root = FindWallpaperEngineRoot();
                if (string.IsNullOrEmpty(root)) return IntPtr.Zero;
                string exe = File.Exists(Path.Combine(root, "wallpaper64.exe"))
                    ? Path.Combine(root, "wallpaper64.exe")
                    : Path.Combine(root, "wallpaper32.exe");
                if (!File.Exists(exe)) return IntPtr.Zero;

                bool runningWe = false;
                foreach (Process p in Process.GetProcessesByName("wallpaper64")) { runningWe = true; break; }
                if (!runningWe) foreach (Process p in Process.GetProcessesByName("wallpaper32")) { runningWe = true; break; }
                if (!runningWe)
                {
                    try { Process.Start(exe); Thread.Sleep(2200); }
                    catch { }
                }

                string args = "-control openWallpaper -file \"" + project.Replace("\"", "") + "\" -playInWindow \"" + LiveWindowTitle + "\" -width 1280 -height 720 -borderless -x -20000 -y -20000";
                try { Process.Start(exe, args); }
                catch { return IntPtr.Zero; }

                for (int i = 0; i < 30; i++)
                {
                    Thread.Sleep(200);
                    hwnd = FindWallpaperWindow();
                    if (hwnd != IntPtr.Zero) break;
                }
                if (hwnd != IntPtr.Zero)
                {
                    liveProject = project;
                    liveWindow = hwnd;
                    HideWallpaperWindow(hwnd);
                }
                return hwnd;
            }
        }

        private void EnsureLivePump()
        {
            if (livePump != null && livePump.IsAlive) return;
            livePump = new Thread(delegate()
            {
                while (running)
                {
                    IntPtr hwnd = liveWindow;
                    if (hwnd == IntPtr.Zero || !IsWindow(hwnd)) break;
                    byte[] jpeg = CaptureWindowJpeg(hwnd);
                    if (jpeg != null && jpeg.Length > 0)
                    {
                        lock (liveFrameLock) { liveFrame = jpeg; }
                    }
                    Thread.Sleep(20);
                }
                livePump = null;
            });
            livePump.IsBackground = true;
            livePump.Name = "Prism wallpaper frames";
            livePump.Start();
        }

        private static byte[] WaitForLiveFrame(int timeoutMs)
        {
            int start = Environment.TickCount;
            while (Environment.TickCount - start < timeoutMs)
            {
                lock (liveFrameLock)
                {
                    if (liveFrame != null && liveFrame.Length > 0) return liveFrame;
                }
                Thread.Sleep(20);
            }
            return null;
        }

        private static void CloseAllWallpaperWindows()
        {
            string root = FindWallpaperEngineRoot();
            string exe = !string.IsNullOrEmpty(root) && File.Exists(Path.Combine(root, "wallpaper64.exe"))
                ? Path.Combine(root, "wallpaper64.exe")
                : (!string.IsNullOrEmpty(root) ? Path.Combine(root, "wallpaper32.exe") : "");
            for (int i = 0; i < 6; i++)
            {
                IntPtr hwnd = FindWindow(null, LiveWindowTitle);
                if (hwnd == IntPtr.Zero) break;
                try
                {
                    if (!string.IsNullOrEmpty(exe) && File.Exists(exe))
                        Process.Start(exe, "-control closeWallpaper -location \"" + LiveWindowTitle + "\"");
                }
                catch { }
                PostMessage(hwnd, WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
                Thread.Sleep(220);
            }
        }

        private static IntPtr FindWallpaperWindow()
        {
            IntPtr direct = FindWindow(null, LiveWindowTitle);
            if (direct != IntPtr.Zero) return direct;            string[] names = new string[] { "wallpaper64", "wallpaper32" };
            foreach (string name in names)
            {
                Process[] processes = Process.GetProcessesByName(name);
                foreach (Process process in processes)
                {
                    try
                    {
                        if (process.MainWindowHandle != IntPtr.Zero && string.Equals(process.MainWindowTitle, LiveWindowTitle, StringComparison.Ordinal))
                            return process.MainWindowHandle;
                    }
                    catch { }
                    finally { process.Dispose(); }
                }
            }
            return IntPtr.Zero;
        }

        private static void HideWallpaperWindow(IntPtr hwnd)
        {
            try
            {
                int style = GetWindowLong(hwnd, GWL_EXSTYLE);
                style = (style | WS_EX_TOOLWINDOW) & ~WS_EX_APPWINDOW;
                SetWindowLong(hwnd, GWL_EXSTYLE, style);
                SetWindowPos(hwnd, HWND_BOTTOM, -20000, -20000, 1280, 720, SWP_NOACTIVATE | SWP_FRAMECHANGED);
            }
            catch { }
        }

        private sealed class WeCapture : IDisposable
        {
            private readonly IntPtr hwnd;
            private readonly Bitmap bitmap;
            private readonly MemoryStream buffer;
            private readonly ImageCodecInfo codec;
            private readonly EncoderParameters parameters;

            public WeCapture(IntPtr window)
            {
                hwnd = window;
                RECT rect;
                if (!GetWindowRect(hwnd, out rect)) throw new InvalidOperationException("Wallpaper Engine window unavailable");
                int width = Math.Max(1, rect.Right - rect.Left);
                int height = Math.Max(1, rect.Bottom - rect.Top);
                bitmap = new Bitmap(width, height);
                buffer = new MemoryStream(256 * 1024);
                foreach (ImageCodecInfo item in ImageCodecInfo.GetImageEncoders())
                {
                    if (item.FormatID == ImageFormat.Jpeg.Guid) { codec = item; break; }
                }
                parameters = new EncoderParameters(1);
                parameters.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, 80L);
            }

            public byte[] Grab()
            {
                try
                {
                    using (Graphics graphics = Graphics.FromImage(bitmap))
                    {
                        IntPtr hdc = graphics.GetHdc();
                        try { PrintWindow(hwnd, hdc, 2); }
                        finally { graphics.ReleaseHdc(hdc); }
                    }
                    buffer.SetLength(0);
                    if (codec != null) bitmap.Save(buffer, codec, parameters);
                    else bitmap.Save(buffer, ImageFormat.Jpeg);
                    return buffer.ToArray();
                }
                catch (Exception ex)
                {
                    try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "prism-we-live-error.log"), DateTime.Now.ToString("s") + " capture: " + ex + Environment.NewLine); }
                    catch { }
                    return null;
                }
            }

            public void Dispose()
            {
                try { parameters.Dispose(); } catch { }
                try { buffer.Dispose(); } catch { }
                try { bitmap.Dispose(); } catch { }
            }
        }

        private static byte[] CaptureWindowJpeg(IntPtr hwnd)
        {
            RECT rect;
            if (!GetWindowRect(hwnd, out rect)) return null;
            int width = rect.Right - rect.Left;
            int height = rect.Bottom - rect.Top;
            if (width <= 0 || height <= 0) return null;
            try
            {
                using (Bitmap bitmap = new Bitmap(width, height))
                {
                    using (Graphics graphics = Graphics.FromImage(bitmap))
                    {
                        IntPtr hdc = graphics.GetHdc();
                        try { PrintWindow(hwnd, hdc, 2); }
                        finally { graphics.ReleaseHdc(hdc); }
                    }
                    using (MemoryStream ms = new MemoryStream())
                    {
                        ImageCodecInfo jpegCodec = null;
                        foreach (ImageCodecInfo codec in ImageCodecInfo.GetImageEncoders())
                        {
                            if (codec.FormatID == ImageFormat.Jpeg.Guid) { jpegCodec = codec; break; }
                        }
                        if (jpegCodec == null) bitmap.Save(ms, ImageFormat.Jpeg);
                        else
                        {
                            using (EncoderParameters parameters = new EncoderParameters(1))
                            {
                                parameters.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, 82L);
                                bitmap.Save(ms, jpegCodec, parameters);
                            }
                        }
                        return ms.ToArray();
                    }
                }
            }
            catch { return null; }
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct RECT { public int Left; public int Top; public int Right; public int Bottom; }

        [DllImport("user32.dll")]
        private static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

        [DllImport("user32.dll")]
        private static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, uint nFlags);

        [DllImport("user32.dll")]
        private static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

        [DllImport("user32.dll")]
        private static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll")]
        private static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [DllImport("user32.dll")]
        private static extern bool IsWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        private static readonly IntPtr HWND_BOTTOM = new IntPtr(1);
        private const uint SWP_NOSIZE = 0x0001;
        private const uint SWP_NOMOVE = 0x0002;
        private const uint SWP_NOACTIVATE = 0x0010;
        private const uint SWP_FRAMECHANGED = 0x0020;
        private const int GWL_EXSTYLE = -20;
        private const int WS_EX_TOOLWINDOW = 0x00000080;
        private const int WS_EX_APPWINDOW = 0x00040000;
        private const uint WM_CLOSE = 0x0010;

        private static void LiveLog(string message)
        {
            try { File.AppendAllText(Path.Combine(Path.GetTempPath(), "prism-we-live-error.log"), DateTime.Now.ToString("HH:mm:ss.fff") + " " + message + Environment.NewLine); }
            catch { }
        }

        private static void WriteJson(NetworkStream stream, Dictionary<string, object> value)
        {
            JavaScriptSerializer serializer = new JavaScriptSerializer();
            serializer.MaxJsonLength = 4 * 1024 * 1024;
            byte[] bytes = Encoding.UTF8.GetBytes(serializer.Serialize(value));
            WriteResponse(stream, 200, "OK", "application/json; charset=utf-8", bytes);
        }

        private static string QueryValue(string query, string key)
        {
            if (string.IsNullOrEmpty(query)) return "";
            string[] parts = query.Split('&');
            foreach (string part in parts)
            {
                int eq = part.IndexOf('=');
                string k = eq >= 0 ? part.Substring(0, eq) : part;
                if (!string.Equals(Uri.UnescapeDataString(k), key, StringComparison.OrdinalIgnoreCase)) continue;
                return eq >= 0 ? part.Substring(eq + 1) : "";
            }
            return "";
        }

        private static Dictionary<string, object> ReadCurrentWallpaper()
        {
            string weRoot = FindWallpaperEngineRoot();
            if (string.IsNullOrEmpty(weRoot)) return null;
            string configPath = Path.Combine(weRoot, "config.json");
            if (!File.Exists(configPath)) return null;

            JavaScriptSerializer serializer = new JavaScriptSerializer();
            serializer.MaxJsonLength = 16 * 1024 * 1024;
            Dictionary<string, object> cfg = AsDict(serializer.DeserializeObject(File.ReadAllText(configPath)));
            if (cfg == null) return null;

            Dictionary<string, object> user = null;
            object direct;
            string username = Environment.UserName.ToLowerInvariant();
            if (cfg.TryGetValue(username, out direct)) user = AsDict(direct);
            if (user == null || !user.ContainsKey("wallpaperconfig"))
            {
                foreach (object value in cfg.Values)
                {
                    Dictionary<string, object> candidate = AsDict(value);
                    if (candidate == null) continue;
                    Dictionary<string, object> candidateGeneral = AsDict(GetValue(candidate, "general"));
                    if (candidate.ContainsKey("wallpaperconfig") || (candidateGeneral != null && candidateGeneral.ContainsKey("wallpaperconfig"))) { user = candidate; break; }
                }
            }
            if (user == null) return null;

            Dictionary<string, object> general = AsDict(GetValue(user, "general"));
            Dictionary<string, object> wc = AsDict(GetValue(general, "wallpaperconfig"));
            if (wc == null) wc = AsDict(GetValue(user, "wallpaperconfig"));
            Dictionary<string, object> selected = AsDict(GetValue(wc, "selectedwallpapers"));
            if (selected == null || selected.Count == 0) return null;

            string monitorKey = selected.ContainsKey("Monitor0") ? "Monitor0" : null;
            if (monitorKey == null)
            {
                foreach (string key in selected.Keys) { monitorKey = key; break; }
            }
            Dictionary<string, object> entry = AsDict(GetValue(selected, monitorKey));
            string file = Str(entry, "file");
            if (string.IsNullOrEmpty(file) || !File.Exists(file)) return null;

            string projectDir = Path.GetDirectoryName(file);
            string projectPath = Path.Combine(projectDir, "project.json");
            Dictionary<string, object> project = null;
            if (File.Exists(projectPath))
            {
                try { project = AsDict(serializer.DeserializeObject(File.ReadAllText(projectPath))); }
                catch { project = null; }
            }

            string type = project != null ? Str(project, "type") : "";
            if (string.IsNullOrEmpty(type))
            {
                string ext = Path.GetExtension(file).ToLowerInvariant();
                type = (ext == ".mp4" || ext == ".webm") ? "video" : (ext == ".pkg" ? "scene" : "image");
            }
            string title = project != null ? Str(project, "title") : "";
            if (string.IsNullOrEmpty(title)) title = Path.GetFileName(projectDir);

            string previewName = project != null ? Str(project, "preview") : "";
            string preview = "";
            if (!string.IsNullOrEmpty(previewName))
            {
                string candidate = Path.Combine(projectDir, previewName);
                if (File.Exists(candidate)) preview = candidate;
            }
            if (string.IsNullOrEmpty(preview))
            {
                string[] names = new string[] { "preview.jpg", "preview.png", "preview.gif" };
                foreach (string name in names)
                {
                    string candidate = Path.Combine(projectDir, name);
                    if (File.Exists(candidate)) { preview = candidate; break; }
                }
            }

            string kind = type;
            string media = "";
            if (type == "video")
            {
                string projectFile = project != null ? Str(project, "file") : "";
                string candidate = !string.IsNullOrEmpty(projectFile) ? Path.Combine(projectDir, projectFile) : file;
                if (!File.Exists(candidate)) candidate = file;
                if (File.Exists(candidate)) { media = candidate; kind = "video"; }
                else if (!string.IsNullOrEmpty(preview)) { media = preview; kind = "scene"; }
            }
            else if (type == "web" || type == "application")
            {
                media = !string.IsNullOrEmpty(preview) ? preview : file;
                kind = "scene";
            }
            else if (type == "scene")
            {
                media = !string.IsNullOrEmpty(preview) ? preview : file;
                kind = "scene";
            }
            else
            {
                media = !string.IsNullOrEmpty(preview) ? preview : file;
                kind = "image";
            }
            if (string.IsNullOrEmpty(media) || !File.Exists(media)) return null;

            string id = new DirectoryInfo(projectDir).Name;
            Dictionary<string, object> current = new Dictionary<string, object>();
            current["id"] = id;
            current["title"] = title;
            current["kind"] = kind;
            current["url"] = "/api/wallpaper-engine/file?path=" + Uri.EscapeDataString(media);
            current["thumbnail"] = !string.IsNullOrEmpty(preview) ? "/api/wallpaper-engine/file?path=" + Uri.EscapeDataString(preview) : current["url"];
            current["source"] = "Wallpaper Engine";
            current["project"] = projectPath;
            return current;
        }

        private static bool IsAllowedWallpaperPath(string path)
        {
            List<string> roots = GetWallpaperRoots();
            foreach (string root in roots)
            {
                if (string.IsNullOrEmpty(root)) continue;
                string normalized = Path.GetFullPath(root).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
                if (path.StartsWith(normalized, StringComparison.OrdinalIgnoreCase)) return true;
            }
            return false;
        }

        private static List<string> GetWallpaperRoots()
        {
            List<string> roots = new List<string>();
            string we = FindWallpaperEngineRoot();
            if (!string.IsNullOrEmpty(we)) roots.Add(we);
            string parent = !string.IsNullOrEmpty(we) ? Path.GetDirectoryName(Path.GetDirectoryName(we)) : "";
            if (!string.IsNullOrEmpty(parent))
            {
                string workshop = Path.Combine(parent, "workshop", "content", "431960");
                if (Directory.Exists(workshop)) roots.Add(workshop);
                string projects = Path.Combine(we, "projects");
                if (Directory.Exists(projects)) roots.Add(projects);
            }
            return roots;
        }

        private static string FindWallpaperEngineRoot()
        {
            List<string> candidates = new List<string>();
            string env = Environment.GetEnvironmentVariable("WALLPAPER_ENGINE_PATH");
            if (!string.IsNullOrEmpty(env)) candidates.Add(env);
            try
            {
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(@"Software\Valve\Steam"))
                {
                    if (key != null)
                    {
                        object steamPath = key.GetValue("SteamPath");
                        if (steamPath != null) AddSteamLibraries(candidates, steamPath.ToString().Replace('/', '\\'));
                    }
                }
            }
            catch { }
            string[] common = new string[] {
                @"C:\Program Files (x86)\Steam",
                @"C:\Program Files\Steam",
                @"D:\Steam",
                @"D:\SteamLibrary",
                @"E:\Steam",
                @"E:\SteamLibrary"
            };
            foreach (string path in common) AddSteamLibraries(candidates, path);
            foreach (string path in candidates)
            {
                try
                {
                    if (File.Exists(Path.Combine(path, "wallpaper64.exe")) || File.Exists(Path.Combine(path, "wallpaper32.exe"))) return path;
                }
                catch { }
            }
            return "";
        }

        private static void AddSteamLibraries(List<string> candidates, string steamPath)
        {
            AddCandidate(candidates, Path.Combine(steamPath, "steamapps", "common", "wallpaper_engine"));
            try
            {
                string vdf = Path.Combine(steamPath, "steamapps", "libraryfolders.vdf");
                if (!File.Exists(vdf)) return;
                foreach (string line in File.ReadAllLines(vdf))
                {
                    if (line.IndexOf("\"path\"", StringComparison.OrdinalIgnoreCase) < 0) continue;
                    string[] pieces = line.Split('"');
                    if (pieces.Length < 4) continue;
                    string library = pieces[3].Replace("\\\\", "\\");
                    AddCandidate(candidates, Path.Combine(library, "steamapps", "common", "wallpaper_engine"));
                }
            }
            catch { }
        }

        private static void AddCandidate(List<string> candidates, string path)
        {
            if (!string.IsNullOrEmpty(path) && !candidates.Contains(path)) candidates.Add(path);
        }

        private static Dictionary<string, object> AsDict(object value)
        {
            return value as Dictionary<string, object>;
        }

        private static object GetValue(Dictionary<string, object> dict, string key)
        {
            if (dict == null) return null;
            object value;
            return dict.TryGetValue(key, out value) ? value : null;
        }

        private static string Str(Dictionary<string, object> dict, string key)
        {
            object value = GetValue(dict, key);
            return value == null ? "" : value.ToString();
        }

        private static string ContentType(string path)
        {
            string ext = Path.GetExtension(path).ToLowerInvariant();
            switch (ext)
            {
                case ".html": return "text/html; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".js": return "text/javascript; charset=utf-8";
                case ".json": return "application/json; charset=utf-8";
                case ".svg": return "image/svg+xml";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".webp": return "image/webp";
                case ".gif": return "image/gif";
                case ".mp4": return "video/mp4";
                case ".webm": return "video/webm";
                case ".ico": return "image/x-icon";
                case ".woff2": return "font/woff2";
                default: return "application/octet-stream";
            }
        }

        private static void WriteResponse(NetworkStream stream, int status, string reason, string type, byte[] body)
        {
            WriteResponse(stream, status, reason, type, body, "public, max-age=3600");
        }

        private static void WriteResponse(NetworkStream stream, int status, string reason, string type, byte[] body, string cache)
        {
            string header = "HTTP/1.1 " + status + " " + reason + "\r\n" +
                "Content-Type: " + type + "\r\n" +
                "Content-Length: " + body.Length + "\r\n" +
                "Cache-Control: " + cache + "\r\n" +
                "Connection: close\r\n" +
                "X-Content-Type-Options: nosniff\r\n\r\n";
            byte[] headerBytes = Encoding.ASCII.GetBytes(header);
            stream.Write(headerBytes, 0, headerBytes.Length);
            if (body.Length > 0) stream.Write(body, 0, body.Length);
            stream.Flush();
        }
    }
}
