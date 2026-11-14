using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Windows.Forms;

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

        [STAThread]
        private static void Main(string[] args)
        {
            bool noBrowser = HasArg(args, "--no-browser") ||
                string.Equals(Environment.GetEnvironmentVariable("PRISM_NO_BROWSER"), "1", StringComparison.Ordinal);

            dataDir = ResolveDataDir();
            portFile = Path.Combine(dataDir, "port-v3.txt");
            Log("Starting Prism portable");

            bool createdNew;
            appMutex = new Mutex(true, AppMutexName, out createdNew);
            if (!createdNew)
            {
                int existingPort = ReadPort();
                if (existingPort > 0 && !noBrowser)
                {
                    OpenBrowser("http://127.0.0.1:" + existingPort + "/");
                }
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            try
            {
                server = new AssetServer();
                server.Start();
                File.WriteAllText(portFile, server.Port.ToString(), Encoding.ASCII);
                Log("Server started at " + server.Url);

                if (!noBrowser)
                {
                    OpenBrowser(server.Url);
                }

                BuildTray();
                Application.Run(new ApplicationContext());
            }
            catch (Exception ex)
            {
                Log("Fatal: " + ex);
                MessageBox.Show(
                    "Prism 物理实验室启动失败。\r\n\r\n" + ex.Message,
                    "Prism 物理实验室",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
            finally
            {
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

            tray.Text = "Prism 物理实验室 v" + Assembly.GetExecutingAssembly().GetName().Version.ToString(3);
            tray.Visible = true;

            ContextMenuStrip menu = new ContextMenuStrip();
            ToolStripMenuItem open = new ToolStripMenuItem("打开实验室");
            open.Click += delegate { OpenBrowser(server.Url); };
            ToolStripMenuItem copy = new ToolStripMenuItem("复制访问地址");
            copy.Click += delegate
            {
                try { Clipboard.SetText(server.Url); }
                catch { }
            };
            ToolStripMenuItem exit = new ToolStripMenuItem("退出");
            exit.Click += delegate { Application.Exit(); };
            menu.Items.Add(open);
            menu.Items.Add(copy);
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add(exit);
            tray.ContextMenuStrip = menu;
            tray.DoubleClick += delegate { OpenBrowser(server.Url); };
            try
            {
                tray.ShowBalloonTip(3500, "Prism 已启动",
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
                    "Prism 物理实验室",
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
                    HandleClient(client);
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

            string key = decoded.TrimStart('/').Replace('\\', '/');
            byte[] body;
            if (!assets.TryGetValue(key, out body))
            {
                WriteResponse(stream, 404, "Not Found", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("Not Found"));
                return;
            }

            string type = ContentType(key);
            WriteResponse(stream, 200, "OK", type, body);
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
                case ".ico": return "image/x-icon";
                case ".woff2": return "font/woff2";
                default: return "application/octet-stream";
            }
        }

        private static void WriteResponse(NetworkStream stream, int status, string reason, string type, byte[] body)
        {
            string header = "HTTP/1.1 " + status + " " + reason + "\r\n" +
                "Content-Type: " + type + "\r\n" +
                "Content-Length: " + body.Length + "\r\n" +
                "Cache-Control: no-store\r\n" +
                "Connection: close\r\n" +
                "X-Content-Type-Options: nosniff\r\n\r\n";
            byte[] headerBytes = Encoding.ASCII.GetBytes(header);
            stream.Write(headerBytes, 0, headerBytes.Length);
            if (body.Length > 0) stream.Write(body, 0, body.Length);
            stream.Flush();
        }
    }
}
