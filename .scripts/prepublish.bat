@echo off
echo "=> Transpiling 'src' into ES5 ..."
echo ""
rd /s /q dist
set NODE_ENV=production
./node_modules/.bin/babel.cmd --ignore tests,stories --plugins "transform-runtime" ./src --out-dir ./dist
echo ""
echo "=> Transpiling completed."
