#!/bin/bash
# 龙娘跑团：一键启动（Mac 上双击这个文件）
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo
  echo "没有找到 Node.js。请到 https://nodejs.org 下载 LTS 版本安装，装好以后再双击 start.command。"
  echo
  read -r -p "按回车键关闭。" _
  exit 1
fi
node scripts/start.mjs
