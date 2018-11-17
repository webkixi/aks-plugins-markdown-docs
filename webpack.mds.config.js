const fs = require('fs')
const fse = require('fs-extra')
const chalk = require('chalk')
const path = require('path')
const globby = require('globby')
const del = require('del')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const wpAssets = []
let mapper = {js: {}, css: {}}


class DoneCompile {
  constructor(options){
    this.options = options
    this.app = options.app
    this.pluginConfigs = options.pluginConfigs
    this.DIST = path.join(process.env.DIST, 'js', options.pluginConfigs.name)
    // this.DIST = path.join(process.env.DIST, 'mds')
  }
  apply(compiler){
    const mdsDist = this.DIST
    const pName = this.pluginConfigs.name
    compiler.hooks.done.tap('markdownDocs', (stats)=>{
      globby.sync([path.join(mdsDist, '**/*')]).forEach(filename=>{
        const fileObj = path.parse(filename)
        const _filename = filename.replace(mdsDist, '')
        const fileKey = pName + '/' + _filename.substring(1).replace(fileObj.ext, '')
        let   mapperCat = 'js'
        let   relativePath = fileKey + fileObj.ext
        if (fileObj.ext == '.css') {
          mapperCat = 'css'
          relativePath = path.join('/js', relativePath)
        }
        // mapper[mapperCat][fileKey] = filename
        mapper[mapperCat][fileKey] = relativePath
      })

      let totalMapper = Aotoo.inject.mapper
      totalMapper = Aotoo.merge(totalMapper, mapper)
      Aotoo.inject.mapper = totalMapper
      console.log(chalk.bold.white('文档插件静态资源编译完成，打印Aotoo.inject查看资源映射内容'));

      // this.app.setMapper(totalMapper)
      // fse.writeJsonSync(path.join(mdsDist, 'mapfile.json'), mapper)
    })

  }
}
const accessStatics = ['category', 'covers', 'detail']
const accessRe = /statics\/(category|covers|detail)/
const dftStaticsPath = path.join(__dirname, './statics')
const dftStaticsFindjs = path.join(dftStaticsPath, '/**/*.js')
const dftStaticsFindcss = path.join(dftStaticsPath, '/**/*.styl')
const dftEntries = {}
globby.sync([dftStaticsFindjs, dftStaticsFindcss]).forEach(function(filename) {
  if (accessRe.test(filename)) {
    const fileObj = path.parse(filename)
    const dirObj = path.parse(fileObj.dir)
    if (fileObj.name == 'index') {
      dftEntries[dirObj.name] = (dftEntries[dirObj.name] || []).concat(filename)
    } else {
      dftEntries[fileObj.name] = (dftEntries[dirObj.name] || []).concat(filename)
    }
  }
})

module.exports = function(app, pluginConfigs) {
  const routerSet = pluginConfigs.routerSet
  const mdsDist = path.join(process.env.DIST, 'js', pluginConfigs.name)

  if (routerSet && Array.isArray(routerSet)) {
    routerSet.forEach(function(item) {
      const srcRoot = item.src
      const dist = path.join(mdsDist, item.urlPrefix)
      let entries = {}
      if (fs.existsSync(srcRoot)) {
        const jssource = path.join(srcRoot, 'statics/**/*.js')
        const csssource = path.join(srcRoot, 'statics/**/*.styl')
        globby.sync([jssource, csssource]).forEach(function (filename) {
          // if (filename.indexOf('/common') == -1) {
          if (accessRe.test(filename)) {
            const fileObj = path.parse(filename)
            const dirObj = path.parse(fileObj.dir)
            if (fileObj.name == 'index') {
              entries[dirObj.name] = (entries[dirObj.name]||[]).concat(filename)
            } else {
              entries[fileObj.name] = (entries[dirObj.name] || []).concat(filename)
            }
          }
        })
      }

      // 用默认的样式、js补全静态资源文件
      if (Object.keys(entries).length) {
        Object.keys(entries).forEach(function(item) {
          if (accessStatics.indexOf(item)>-1) {
            let itemStatics = entries[item]
            if (itemStatics.length != 2) {
              const itemPath = itemStatics[0]
              const itemObj = path.parse(itemPath)
              if (itemObj.ext == '.js') {
                entries[item].push(dftEntries[item][1])
              } else {
                entries[item].push(dftEntries[item][0])
              }
            }
          }
        })
      } else {
        entries = dftEntries
      }

      const itemAsset = mkWebpackConfig({ entries, dist, app, pluginConfigs })
      if (itemAsset) {
        wpAssets.push( itemAsset )
      }
    })

    if (wpAssets.length) {
      return wpAssets
    }
  }
}

function mkWebpackConfig(options) {
  const {entries, dist, app, pluginConfigs} = options
  const DIST = {
    path: dist,
    filename: '[name].js',
  }
  // if (Object.keys(entries).length) {
  return {
    entry: entries,
    output: DIST,
    module: {
      rules: [{
          test: /\.js(x?)$/,
          use: ['babel-loader'],
        },
        {
          test: /\.styl$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                importLoaders: 2
              }
            },
            'stylus-loader'
          ]
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].css'
      }),
      new DoneCompile({app, pluginConfigs})
    ]
  }
  // }
}
