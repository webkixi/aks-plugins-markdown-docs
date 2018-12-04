import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import md5 from 'blueimp-md5'
import MarkdownDocs from './markdowndocs'
const MarkdownIns = new MarkdownDocs({})

function homeImagPathAdjust(homeImgs=[], docAbsRoot, imgsPublic){
  return homeImgs.map(img => img.replace(docAbsRoot, imgsPublic) )
}

/**
 * 分类页
 * 展示封面页的子项
 * @param {*} folderInfo 分类页数据
 * @param {*} routePrefix 分类页相对路径
 * @param {*} renderView render方法
 */
module.exports = function category(
  folderInfo, 
  routePrefix, 
  myurl, 
  renderView, 
  docAbsRoot, 
  asset,
  options
){
  const did = md5(myurl)
  const staticDid = 'statics_'+did
  const _ctx = {
    docAbsRoot,
    routePrefix,
    options
  }
  let renderData = Cache.ifid(did, ()=>{
    let home, homeJsx, homeStr
    const tree = folderInfo.tree
    for (let ii=0;ii<tree.length;ii++) {
      const item = tree[ii]
      if (item.idf == 'root') {
        if (item.home) {
          let homeInfo = MarkdownIns.file(item.home.path)
          if (homeInfo) {
            home = Aotoo.merge({}, item.home, homeInfo)
          }
        }
      }
    }
    if (!home) homeStr = '该分类没有信息'
    else {
      if (home.img) home.img = homeImagPathAdjust(home.img, docAbsRoot, options.imgsPublic)
    }
    if (home && home.img && home.img.length) {
      home.imgs = home.img
      home.img = undefined
    }

    if (home && home.imgs && !home.imgs.length) {
      home.imgs = undefined
    }

    let treeStr = ''
    if (tree.length > 1) {
      treeStr = folderInfo.treeMenu
    }

    const statics = asset.category.call(_ctx, staticDid)  // js css 静态资源
    const _renderData = {
      title: '分类页',
      mycss: statics.css,
      myjs: statics.js,
      tree: treeStr,
      content: home,
      pageData: options.pageData
    }

    Cache.set(did, _renderData, 1*60*60*1000)
    return _renderData
  })

  renderView('category', renderData)
}