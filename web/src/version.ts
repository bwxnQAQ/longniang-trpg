// 版本号和作者写在 package.json 里，构建网页时带进来。

export const APP_VERSION_LABEL = `V${__APP_VERSION__}`;
export const APP_AUTHOR = __APP_AUTHOR__;
/** 写在页脚版本号后面（V0.x 是「删档内测版」，V1.0.0 起是正式版）；不要了就改成空字符串。 */
export const APP_STAGE = '正式版';
/** 交流的 QQ 群（V0.9.0）：写在页脚版本号后面，不要了就改成空字符串。 */
export const APP_QQ_GROUP = '1130127996';
