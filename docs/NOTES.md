# Notes

[Python portable](https://www.nuget.org/packages/python/3.13.12)

## Dev Environment

```shell
pushd \\wsl.localhost\WSL\home\vlado\dev\sdnext-launcher
npm install
npm audit fix
npm install-scripts approve electron-winstaller@5.4.0
npm install-scripts approve esbuild@0.28.1
npm install-scripts approve node-pty@1.1.0
npm run build
npm run prod
npm run package
```
