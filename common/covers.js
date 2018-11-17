import path from 'path'
import md5 from 'blueimp-md5'

/**
 * 封面页
 * 1. 分析指定目录下的所有一级目录
 * 2. 获取一级目录的描述信息
 * @param {*} docsRoot 绝对路径
 * 
 * [ { title: '10aotoo',
    path: '/Users/yc/git/rezero/server/plugins/mds/docs/10aotoo',
    url: '10aotoo',
    idf: '10aotoo_1',
    parent: 'root',
    home: 
     { title: '',
       descript: '',
       path: '',
       url: '',
       img: '/Users/yc/git/rezero/server/plugins/mds/docs/10aotoo/index.jpg',
       config: '',
       exist: false },
    config: { names: [Object], descript: [Object] } } ......]
 */

module.exports = function coversHome(
  docsRoot, 
  routePrefix, 
  MarkdownIns, 
  asset,
  options
){
  const did = md5(docsRoot)
  const staticDid = 'statics_'+did
  const _ctx = {
    docsRoot,
    routePrefix,
    options
  }
  const rootObj = path.parse(docsRoot)
  const realyRootDir = rootObj.name
  return Cache.ifid(did, ()=>{
    const covs = MarkdownIns.covers(docsRoot)
    const homeCoversConfig = covs.map( cov => {
      var covTitle = cov.title
      var covDescripts = cov.home&&cov.home.descript||'还没有描述内容'
      var imgurl = (function(){
        let myExpoImg = 'http://www.agzgz.com/docs/component/_home.jpg'
        if (cov.home){
          if (cov.home.img) {
            myExpoImg = cov.home.img[0]
            myExpoImg = myExpoImg.indexOf('/') == 0 ? myExpoImg.replace(docsRoot, options&&options.imgsPublic) : myExpoImg
          }
        }
        return myExpoImg
      })()
      
      // 从配置文件读取该封面的属性信息
      if (cov.config) {
        // 将英文目录名映射为中文目录名
        if (cov.config.names) {
          const names = cov.config.names
          covTitle = names[covTitle] ? names[covTitle] : covTitle
        }

        if (cov.config.descript) {
          const covConfigDescripts = cov.config.descript
          covDescripts = covConfigDescripts[cov.title] ? covConfigDescripts[cov.title] : covDescripts
        }
      }
      cov.url = cov.url.replace(realyRootDir, '')
      return {
        title: <img src={imgurl}/>,
        url: path.join(routePrefix, cov.url),
        body: [
          <div className="cover-title"><a href={path.join(routePrefix, cov.url)}>{covTitle}</a></div>,
          <div className="cover-descript">{covDescripts}</div>,
        ]
      }
    })
    // const treeJsx = tree
    const homesJsx = Aotoo.list({ data: homeCoversConfig, listClass: 'covers-list' })
    const homesStr = Aotoo.render(<div className="covers">{homesJsx}</div>)
    const statics = asset.covers.call(_ctx, staticDid)  // js css 静态资源
    const _renderData = {
      title: '文档分类',
      mycss: statics.css,
      myjs: statics.js,
      content: homesStr
    }
    Cache.set(did, _renderData, 1*60*60*1000)
    return _renderData
  })
}