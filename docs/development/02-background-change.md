# 更换 Live2D 数字人背景

## 背景加载机制

背景配置在 `lappdefine.ts` 中定义：

```typescript
// live2d-avatar/CubismSdkForWeb-5-r.4/Samples/TypeScript/Demo/src/lappdefine.ts

// 模型后的背景图片文件
export const BackImageName = 'nokia_reception_desk.png';

// 前景吧台图片（遮住数字人腿部）
export const DeskImageName = 'desk_foreground.png';
```

渲染时 `lappview.ts` 的 `initializeSprite()` 从 `ResourcesPath + BackImageName` 加载 PNG 图片作为 WebGL 纹理，铺满 Canvas。

资源路径为（相对于 `Demo/` 目录）：
```
public/Resources/nokia_reception_desk.png
```

## 三处都要替换

项目中有 **3 个位置** 存在背景图片，都需要替换：

### 1. 源头文件（最重要）
```
Samples/Resources/nokia_reception_desk.png
```
`npm start` 时 `copy_resources.js` 从这里拷贝到 `public/Resources/`。**必须换这个**，否则下次启动会被覆盖回来。

### 2. public/（Vite dev server）
```
Samples/TypeScript/Demo/public/Resources/nokia_reception_desk.png
```
`copy_resources.js` 启动时从源头拷贝到这里，dev server 直接读取。

### 3. dist/（构建产物）
```
Samples/TypeScript/Demo/dist/Resources/nokia_reception_desk.png
```
之前构建遗留的缓存文件，如果存在也可能被读到。

## 一句话更换命令

假设你的新图在 `D:\my_bg.png`，打开终端执行：

```bash
cd ~/Desktop/Software-Digital-human/live2d-avatar/CubismSdkForWeb-5-r.4

# 替换三处（源头 + public + dist）
cp "D:/my_bg.png" "Samples/Resources/nokia_reception_desk.png"
cp "D:/my_bg.png" "Samples/TypeScript/Demo/public/Resources/nokia_reception_desk.png"
cp "D:/my_bg.png" "Samples/TypeScript/Demo/dist/Resources/nokia_reception_desk.png"
```

然后重启 Live2D 前端：
```bash
cd Samples/TypeScript/Demo
npm start
```

## 更换文件名

如果想用不同的文件名：

1. 把新图放到上述三个目录，用自己的文件名
2. 修改 `lappdefine.ts`：
   ```typescript
   export const BackImageName = '你的文件名.png';
   ```
3. 重启 `npm start`

## 调整为纯色/渐变背景（不需要图片）

如果不需要图片背景，可以修改 `lappview.ts` 的 `render()` 方法，用 `gl.clearColor()` 设置纯色，或添加 CSS 背景。

## 吧台前景

目前还有一个前景吧台图片 `desk_foreground.png`，遮住 Haru 模型腿部。可以通过页面上的"吧台模式"按钮切换显示。
