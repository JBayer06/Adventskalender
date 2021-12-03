echo "--- Building frontend ---"
cd ../adventskalender
npm install
npm run build -- --outputPath=../docker/frontend
echo "--- Building backend ---"
cd ../api
npm install
npx @vercel/ncc build src/index.ts -o ../docker/backend
echo "--- Copying env ---"
cd ..
cp ./container-env.json ./docker/container-env.json
echo "--- Building Container Image ---"
cd ./docker
PACKAGE_VERSION=$(cat ../adventskalender/package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g' | tr -d '[[:space:]]')
docker build -t hrueger/adventskalender:v$PACKAGE_VERSION .
rm -r frontend backend