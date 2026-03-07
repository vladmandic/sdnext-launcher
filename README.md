# SD.Next Installer & Launcher

A simple, all-in-one application for installing and running [SD.Next](https://github.com/vladmandic/sdnext) on Windows 10/11. No technical expertise required—the installer handles everything for you.

- **No setup hassles** — All dependencies bundled. `Python` and `Git` included, nothing extra to install.
- **One-click installation** — Just download the `EXE` and run. The installer guides you through everything.
- **Customizable setup** — Choose which GPU backend (*CUDA, ROCm, Zluda, IPex, DirectML, OpenVino*), where to install, and advanced options.
- **Built-in launcher** — After installation, launch SD.Next directly from the app. No command line needed.
- **Configuration saving** — Your preferences (paths, branch, custom parameters) are saved and reused.
- **Real-time progress** — Watch the installation unfold with live terminal output and helpful status updates.
- **Portable** — Move the installation directory anywhere or to another machine. Everything is self-contained.

## System Requirements

- **Windows 10 or Windows 11** (64-bit)
- **5+ GB free disk space** (for SD.Next and models)
- **Internet connection** (for downloading the application during installation)
- **No admin rights required** — Standard user privileges are enough

### Installation Steps

1. **Download** `SD.Next-<version>.exe` and run it
2. **Bootstrap** — On first run, click "Bootstrap" to unpack the bundled tools
3. **Configure** — Adjust your settings:
   - Select compute backend (GPU type or CPU)
   - Choose repository branch (master or dev)
   - Set custom installation paths
   - Set models path if you want to re-use your existing models
4. **Install** — Click "Install" and let the app set everything up
5. **Launch** — Once installation completes, click "Start" to run SD.Next

> [!NOTE]
> The entire process takes 10-30 minutes depending on your internet speed and hardware.

## Support & Documentation

- **Logs Are Your Friend**: Always check the terminal output and logs if something goes wrong—they contain detailed information
- **Full Documentation**: Available in the **Docs** tab of the installer
- **Issue Tracker**: Report problems on [GitHub Issues](https://github.com/vladmandic/sdnext/issues)

## License

Both [SD.Next](https://github.com/vladmandic/sdnext) and [SD.Next Launcher](https://github.com/vladmandic/sdnext-launcher) are released under the [MIT License](LICENSE)

---

For developer documentation, see [DEV.md](DEV.md)
