import fs from 'fs'
import path from 'path'
const inject = Aotoo.inject.init()

function staticsStr(myCss, myJs, id){
  return Cache.ifid(id, function(){

    inject.init()
    .css(myCss)
    .js(myJs)
  
    const cssAry = Object.keys(inject.staticList.css).map( item => inject.staticList.css[item] )
    const jsAry = Object.keys(inject.staticList.js).map( item => inject.staticList.js[item] )
  
    const cssStr = cssAry.join('\n')
    const jsStr = jsAry.join('\n')

    const myStatics = {
      css: cssStr,
      js: jsStr
    }

    Cache.set(id, myStatics)
    return myStatics
  })
  
}

function covers(id){
  const _ctx = this
  const { options } = _ctx
  const { publicPath } = options
  
  // const cssContent = MD_DOCS_STATICS((this.docAbsRoot || this.docsRoot)).covers.css
  // const jsContent = MD_DOCS_STATICS((this.docAbsRoot || this.docsRoot)).covers.js

  const cssContent = path.join(publicPath, 'covers')
  const jsContent = path.join(publicPath, 'covers')

  return staticsStr(
    ['common', cssContent],
    ['vendors', 'common', jsContent],
    id||'mds-statics-covers'
  )
}

function category(id){
  const _ctx = this
  const { options } = _ctx
  const { publicPath } = options
  
  // const cssContent = MD_DOCS_STATICS(this.docAbsRoot).category.css
  // const jsContent = MD_DOCS_STATICS(this.docAbsRoot).category.js

  const cssContent = path.join(publicPath, 'category')
  const jsContent = path.join(publicPath, 'category')

  return staticsStr(
    ['common', cssContent],
    ['vendors', 'common', 't/prettfy', jsContent],
    id||'mds-statics-category'
  )
}

function detail(params, id){
  // const _ctx = {
  //   docAbsRoot,
  //   routePrefix
  // }
  const _ctx = this
  const { options } = _ctx
  const { publicPath } = options

  // const cssContent = MD_DOCS_STATICS(this.docAbsRoot).detail.css
  // const jsContent = MD_DOCS_STATICS(this.docAbsRoot).detail.js

  const cssContent = path.join(publicPath, 'detail')
  const jsContent = path.join(publicPath, 'detail')

  let myCss = ['common', cssContent] 
  let myJs = ['vendors', 'common', 't/prettfy', jsContent]

  if (params.css) {
    const paramsCss = params.css.split(',')
    mycSS = ['common', ...paramsCss, cssContent] 
  }

  if (params.js) {
    const paramJs = params.js.split(',')
    myJs = ['vendors', 'common', 't/prettfy', ...paramJs, jsContent]
  }

  return staticsStr( myCss, myJs, (id||'mds-statics-detail') )
}

module.exports = {
  covers: covers,
  category: category,
  detail: detail,
  staticsStr
}
