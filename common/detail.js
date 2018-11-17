import md5 from 'blueimp-md5'

/**
 * 分类页
 * 展示封面页的子项
 * @param {*} folderInfo 分类页数据
 * @param {*} _docurl 分类页相对路径
 * @param {*} renderView render方法
 */
module.exports = // 详情页
  function detail (
    fileInfo,
    folderInfo,
    _docurl,
    routePrefix,
    renderView,
    docAbsRoot,
    asset,
    options
  ) {
    const did = md5(_docurl)
    const staticDid = 'statics_' + did

    const _ctx = {
      docAbsRoot,
      routePrefix,
      options
    }

    const renderData = Cache.ifid(did, () => {
      const treeStr = folderInfo.treeMenu
      const statics = asset.detail.call(_ctx, fileInfo.params, staticDid) // js css 静态资源
      const _renderData = {
        title: fileInfo.title,
        descript: (fileInfo.params && fileInfo.params.desc) || fileInfo.descript || '',
        mycss: statics.css,
        myjs: statics.js,
        tree: treeStr,
        menu: fileInfo.menu,
        content: fileInfo.content
      }

      Cache.set(did, _renderData, 1000 * 1 * 60 * 60)
      return _renderData
    })
    renderView('detail', renderData)
}
