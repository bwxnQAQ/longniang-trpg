declare const __DEV__: boolean;
/** 版本号（package.json 的 version，构建网页时写进来）。 */
declare const __APP_VERSION__: string;
/** 作者（package.json 的 author）。 */
declare const __APP_AUTHOR__: string;
declare module '*.css';
declare module '*.webp' {
  const src: string;
  export default src;
}
declare module '*.png' {
  const src: string;
  export default src;
}
