const isPages = process.env.GITHUB_PAGES === "true"
const repoName = "asset-allocation-calculator"
const config = {
  output: "export",
  ...(isPages ? { basePath: `/${repoName}`, assetPrefix: `/${repoName}/` } : {}),
  images: { unoptimized: true },
}
export default config
