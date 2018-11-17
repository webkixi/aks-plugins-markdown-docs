import fs from 'fs'
import glob from 'glob'
import md5 from 'blueimp-md5'
const path = require('path')
const mdParse = require('../markdown')

function getHomeStruct(){
  return {
    title: '',
    descript: '',
    path: '',
    url: '',
    img: '',
    config: '',
    exist: false
  }
}

function cloneIt(obj){
  return JSON.parse(JSON.stringify(obj))
}

// 保留目录名，用于检测外部的环境
const reserveDir = [
  'statics',    // 存放静态资源文件
  'views'       // 存放模板文件
]

// markdown目录及文档分析
export default class MarkdownDocs {
  constructor(opts={}){
    this.opts = opts
    this.folderInfo = this:: this.folderInfo
    this.parse = this:: this.parse
    this.file = this:: this.file
    this.folder = this:: this.folder
    this.covers = this:: this.covers
  }


  // 分析目录并返回目录结构
  // 递归遍历所有文件及目录
  // 生成aotoo.transtree的数据树结构，参考aotoo.transtree
  folderInfo(_dir, cover){
    const opts = this.opts
    const that = this
    let tree = []

    const rootobj = path.parse(_dir)
    let rootFeather = {
      title: rootobj.name,
      path: _dir,
      url: rootobj.name,
      idf: 'root'
    }

    function loopDir($_dir, parent, parentObj){
      const $dir = $_dir+'/*'
      const $_dirObj = path.parse($_dir)
      let home = getHomeStruct()
      try {
        const __dirs = glob.sync($dir)
        for (let item of __dirs) {
          const stat = fs.statSync(item) 
          const obj = path.parse(item)

          // 保留文件目录
          if (stat.isDirectory() && parent=='root') {
            if (reserveDir.indexOf(obj.name) >-1) {
              continue;
            }
          }
          
          if (stat.isFile()) {
            // const raw = fs.readFileSync(item, 'utf-8')
            // const mdInfo = md(raw, {})
  
            // 目录描述图
            if (['.jpg', '.jpeg', '.png', '.gif'].indexOf(obj.ext)>-1) {
              if (obj.name.indexOf('index')>-1) {
                home.img = home.img ? home.img.concat(item) : [].concat(item)
              }
            }
  
            // 目录配置文件
            if (obj.name == 'config' && parent) {
              parentObj.config = require(item)
            }
  
            if (obj.ext == '.md') {
              const mdInfo = that.file(item)
              
              // 目录首页
              if (obj.name == 'index') {
                const _obj = path.parse(obj.dir)
                home.title = mdInfo.title||obj.name
                home.descript = mdInfo.descript
                home.path = item
                home.url = _obj.name
                home.img = home.img ? home.img : mdInfo.img
                home.imgs = mdInfo.imgs
                home.exist = true
                home.params = mdInfo.params
              } else {
                let feather = {
                  title: mdInfo.title,
                  descript: mdInfo.descript,
                  path: item,
                  url: obj.name+obj.ext,
                  img: mdInfo.img,
                  imgs: mdInfo.imgs,
                  params: mdInfo.params
                }
                if (parent) {
                  feather.url = parentObj.url+'/'+feather.url
                  feather.parent = parent
                }
                tree.push(feather)
              }
  
  
              // 将home文件加入
              if (parent) {
                parentObj.home = home
              }
            }
          }
  
          if (stat.isDirectory()) {
            const parentId = _.uniqueId(obj.name+'_')
            let dirFeather = {
              title: obj.name,
              path: item,
              url: obj.name,
              idf: parentId
            }
            if (parent) {
              dirFeather.url = parentObj.url+'/'+dirFeather.url
              dirFeather.parent = parent
            }
            tree.push(dirFeather)
            loopDir(item, parentId, dirFeather)
          }
        }
      } catch (error) {
          
      }
      
    }
    let _rootFeather = cloneIt(rootFeather)
    tree.push(_rootFeather)
    loopDir(_dir, 'root', _rootFeather)
    
    return {tree}
  }

  parse(raw, opts){
    return mdParse(raw, opts)
  }

  file(filename){
    const that = this
    const fileFeather = path.parse(filename)
    if (fileFeather.ext !== '.md') return 
    
    let opts = this.opts || {}
    opts.filename = filename
    if (fs.existsSync(filename)) {
      const fid = md5(filename)
      return Cache.ifid(fid, function(){
        const raw = fs.readFileSync(filename, 'utf-8')
        const mdInfo = that.parse(raw, opts)
        Cache.set(fid, mdInfo, 6*24*60*60*1000)
        return mdInfo
      })
    }
  }

  folder(dir, cover){
    if (dir && fs.existsSync(dir)) {
      const $id = 'folder_' + dir
      return Cache.ifid($id, () => {
        const foldInfo = this.folderInfo(dir, cover)
        Cache.set($id, foldInfo)
        return foldInfo
      })
    }
  }


  // 查找文档目录下的分类目录，过滤文档目录下的文档
  covers(dir){
    const covers = []
    const that = this
    const $id = 'markdownDocs_'+dir
    if (dir && fs.existsSync(dir)) {
      return Cache.ifid($id, function() {
        glob.sync(dir).forEach(item => {
          const stat = fs.statSync(item)
          const isDirectory = stat.isDirectory()
          if (isDirectory) {
            const covs = that.folder(item, true).tree
            covs.forEach($cov => { if($cov.parent == 'root' && $cov.idf) covers.push($cov) })
          }
        })
        Cache.set($id, covers)
        return covers
      })
    }
  }
}