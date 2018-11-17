import fs from 'fs'
import _ from 'lodash'
import co from 'co'
import chalk from 'chalk'
import path from 'path'
import MarkdownDocs from './common/markdowndocs'
import MyRender from './common/render'
import coversHome from './common/covers'
import category from './common/category'
import detail from './common/detail'
let webpackConfigs = require('./webpack.mds.config')

const MarkdownIns = new MarkdownDocs({})
const _statics = require('./statics')
const defaultConfig = {
  name: 'mds',
  prefixSet: {
    get: [
      '/',
      '/:cat',
      '/:cat/:title',
      '/:cat/:title/:id',
      '/:cat/:title/:id/:p1',
      '/:cat/:title/:id/:p1/:p2',
      '/:cat/:title/:id/:p1/:p2/:p3'
    ],
    post: ['/', '/:cat', '/:cat/:title', '/:cat/:title/:id']
  }
}

function __mkTreeMenu(folderInfo, opts={}) {
  const tree = _.cloneDeep(folderInfo.tree)
  for (let ii = 0; ii < tree.length; ii++) {
    const item = tree[ii]
    if (item.idf == 'root') {
      item.url = path.join('/', opts.routePrefix, item.url)
      if (item.config) {
        if (item.config.names) {
          const names = item.config.names
          item.title = names[item.title] ? names[item.title] : item.title
        }
      }
    } else {
      const _parent = Aotoo.find(tree, { idf: item.parent })
      const myConfig = item.config ? item.config : _parent.config
      if (myConfig) {
        if (myConfig.names) {
          const names = myConfig.names
          item.title = names[item.title] ? names[item.title] : item.title
        }
      }
      item.url = path.join('/', opts.routePrefix, item.url)
    }
  }
  const treeJsx = Aotoo.tree({ data: tree })
  const treeStr = Aotoo.render(treeJsx)
  return {treeJsx, treeStr}
}

function mkTreeMenu(folderInfo, opts={}) {
  const $id = 'folderEntry_'+opts.root
  return Cache.ifid($id, function() {
    const {treeJsx, treeStr} = __mkTreeMenu(folderInfo, opts)
    folderInfo.treeJsx = treeJsx
    folderInfo.treeMenu = treeStr
    Cache.set($id, folderInfo)
    return folderInfo
  })
}

function renderMyDocs(ctx, opts={}){
  let routePrefix = opts.routePrefix
  const DOCS_RLA_ROOT = './'
  const DOCS_ABS_ROOT = opts.docsRoot||opts.src
  const statics = opts.statics || _statics  // 样式, js等内容
  opts.imgsPublic = opts.imgsPublic || '/imgs'
  
  const renderView = MyRender(ctx, {viewRoot: opts.viewRoot, docAbsRoot: DOCS_ABS_ROOT})
  const params = ctx.params
  const fkp = ctx.fkp

  const existsDocsRoot = fs.existsSync(DOCS_ABS_ROOT)
  if (!existsDocsRoot) {
    return renderView('404')
  }
  // 封面页 covers 首页
  if (!params.cat) {
    const renderData = coversHome(
      DOCS_ABS_ROOT, 
      routePrefix, 
      MarkdownIns, 
      statics,
      opts
    )

    renderView('cover', renderData)
  } 
  else {
    const {p3, p2, p1, id, title, cat} = params
    let _docurl = DOCS_RLA_ROOT
    if (cat) _docurl = path.join(_docurl, cat)
    if (title) _docurl = path.join(_docurl, title)
    if (id) _docurl = path.join(_docurl, id)
    if (p1) _docurl = path.join(_docurl, p1)
    if (p2) _docurl = path.join(_docurl, p2)
    if (p3) _docurl = path.join(_docurl, p3)
    
    // const docurl = path.join(__dirname, _docurl)
    const docurl = path.join(DOCS_ABS_ROOT, _docurl)
    const caturl = path.join(DOCS_ABS_ROOT, cat)

    if (fs.existsSync(docurl)) {
      let folderInfo, fileInfo
      let targetUrl = caturl
      const obj = path.parse(docurl)
      const stat = fs.statSync(docurl)

      if (stat.isDirectory() && obj.name!==cat) {
        targetUrl = docurl
        const targetObj = path.parse(obj.dir)
        routePrefix = path.join(routePrefix, targetObj.name)
      }

      folderInfo = MarkdownIns.folder(targetUrl)
      if (folderInfo) {
        folderInfo = mkTreeMenu(folderInfo, { routePrefix, root: targetUrl })
      }

      if (stat.isFile()) {
        // folderInfo = MarkdownIns.folder(caturl)
        fileInfo = MarkdownIns.file(docurl)
      } 
      else if (stat.isDirectory()) {
        // folderInfo = MarkdownIns.folder(caturl)
      } else {
        const _docurl = docurl+'.md'
        const _stat = fs.statSync(_docurl)
        if (_stat.isFile()) {
          // folderInfo = MarkdownIns.folder(caturl)
          fileInfo = MarkdownIns.file(docurl)
        }
      }

      const myurl = path.join(routePrefix, _docurl)
      if (fileInfo && folderInfo) {
        detail(
          fileInfo, 
          folderInfo, 
          myurl, 
          routePrefix, 
          renderView, 
          DOCS_ABS_ROOT, 
          statics,
          opts
        )
      }

      if (folderInfo && !fileInfo) {
        category(
          folderInfo,
          routePrefix, 
          myurl, 
          renderView, 
          DOCS_ABS_ROOT, 
          statics,
          opts
        )
      }
    }
  }
}


// 插件
function pluginDocs(ctx, options={}){
  let type = 'markdown',
      fkp = ctx.fkp

  if (options) {
    // if (Aotoo.isPlainObject(options)) {
    //   options = Aotoo.merge(pluginConfigs, options)
    // }
    type = options.type || type
  }

  // 给markdown实例设置属性
  MarkdownIns.opts = options

  if (type == 'uri') {
    return function(opts={}){
      ctx.routePrefix = opts.routePrefix||'/'
      renderMyDocs(ctx, opts)
    }
  }

  if (type == 'markdown') {
    MarkdownIns.appendRouterPreset = function (opts) {
      if (typeof opts.prefix == 'string') {
        fkp.routepreset(opts.prefix, {
          ...prefixSet,
          customControl: function (ctx, next) {
            opts.routePrefix = opts.prefix || '/'
            renderMyDocs(ctx, opts)
          }
        })
      }
    }

    function mdInstanceFun(params) {}
    mdInstanceFun.md = MarkdownIns
    return mdInstanceFun
  }

  // 作为插件使用
  // const urdocs = fkp.mds()
  // urdocs({
  //   statics: statics,
  //   routePrefix: routePrefix,
  //   docsRoot: path.join(__dirname, './docs')
  // })
}

function responseSet (ctx, options) {
  options.type = 'uri'
  const startRenderMyDocs = pluginDocs.call(this, ctx, options)
  startRenderMyDocs(options)
}

// 设置文档路由
/**
 * 
 * @param {JSON} item urlPrefix, src
 * @param {JSON} pluginConfigs 
 * @param {*} fkp 
 */
function setRouterCustomControl(item, pluginConfigs, fkp) {
  const {urlPrefix, src} = item
  const {prefixSet} = pluginConfigs
  const imgUrl = ((urlPrefix + 'imgs').replace(/[\/|\\]]/g, ''))
  fkp.routepreset(urlPrefix, { ...prefixSet,
    customControl: function (ctx, next) {
      const routePrefix = this.opts.prefix || '/'   // koa2 路由前缀
      responseSet.call(this, ctx, {
        routePrefix,
        pluginConfigs,
        imgsPublic: imgUrl,
        publicPath: path.join(pluginConfigs.name, urlPrefix),
        ...item
      })
    }
  })
}

// 设置图片静态服务地址
function setImageStaticServic(durl, dpath, fkp) {
  const imgPath = path.join(dpath, 'images')
  const imgUrl = ((durl + 'imgs').replace(/[\/|\\]]/g, ''))
  console.log(durl, chalk.bold.yellow(`文档启用静态图片地址: ${imgUrl}`));
  fkp.statics(dpath, {
    dynamic: true,
    prefix: imgUrl
  })
}


async function preBuildStatics(fkp, webpackConfigs, pluginConfigs) {
  if (webpackConfigs) {
    if (pluginConfigs.name) {
      fkp.webpack({ config: function(app) {
        if (typeof webpackConfigs == 'function') {
          return webpackConfigs(app, pluginConfigs)
        } else {
          return webpackConfigs
        }
      }})
    } else {
      console.log(chalk.yellow.bold('请指定文档配置的name'));
    }
  }
}

export default function(fkp, mdOpts={}){
  let pluginConfigs = mdOpts['pluginConfigs']
  // let webpackConfigs = mdOpts['webpackConfigs']
  // let webpackConfigs = webpackConfigs

  pluginConfigs = Aotoo.merge({}, defaultConfig, pluginConfigs)
  const ROUTERSET = pluginConfigs.routerSet
  const IMGROOT   = pluginConfigs.imgRoot //文档根目录

  if (webpackConfigs) {
    preBuildStatics(fkp, webpackConfigs, pluginConfigs)
  }

  if (ROUTERSET && ROUTERSET.length) {
    ROUTERSET.forEach(function(routeItem) {
      if (routeItem['urlPrefix'] && routeItem['src']) {
        if (fs.existsSync(routeItem['src'])) {
          const routerUrlPrefix = routeItem['urlPrefix']
          const routerSrcPath = routeItem['src']
          setImageStaticServic(routerUrlPrefix, routerSrcPath, fkp)
          setRouterCustomControl(routeItem, pluginConfigs, fkp)
        }
      }
    })
  }
  
  if (fs.existsSync(IMGROOT)) {
    fkp.statics(IMGROOT, {
      dynamic: true,
      prefix: '/myimgs'
    })
  }

  // const imgprefix = path.join(pluginConfigs.name, 'images')
  const imgprefix = '/'+pluginConfigs.name+'images'
  if (fs.existsSync(IMGROOT)) {
    fkp.statics(IMGROOT, {
      dynamic: true,
      prefix: imgprefix
    })
  }

  // fkp.routepreset('/docs', 
  // { ...prefixSet, 
  //   customControl: function(ctx, next) {
  //     responseSet.call(this, ctx, {
  //       imgsPublic: '/mddocs',
  //       docsRoot: DOCSROOT
  //     })
  //   }
  // })
  return pluginDocs
}
