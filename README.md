This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

## Getting Started

run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

You can start editing the popup by modifying `popup.tsx`. It should auto-update as you make changes. To add an options page, simply add a `options.tsx` file to the root of the project, with a react component default exported. Likewise to add a content page, add a `content.ts` file to the root of the project, importing some module and do some logic, then reload the extension on your browser.

For further guidance, [visit our Documentation](https://docs.plasmo.com/)

## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

## Submit to the webstores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub action. Prior to using this action however, make sure to build your extension and upload the first version to the store to establish the basic credentials. Then, simply follow [this setup instruction](https://docs.plasmo.com/workflows/submit) and you should be on your way for automated submission!

## 结论
1. 清空某个 Session 的 Tab 后，不会自动删除 session（考虑到用户可能还会在新增 Tab 进来）


## ~~功能列表~~
- [x] 记录打开/关闭历史
- [ ] 能收藏 + 标签
- [ ] 全局搜索

## 其他
- [ ] 日志方案，复现问题使用
- [ ] chrome 分组变为 Session 的子分组，和标签隔离

## bugfix
- [ ] 长时间未使用浏览器，意外关闭，下次打开时需要判断显示上一次的意外关闭的窗口信息，不能直接使用实时数据
