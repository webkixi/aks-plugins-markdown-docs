import fs from 'fs'
import path from 'path'
const dftViews = path.join(__dirname, '../views')

export default function(ctx, opts={}){
  const fkp = ctx.fkp
  let __viewRoot = opts.viewRoot ? opts.viewRoot : path.join(opts.docAbsRoot, 'views')
  if (!fs.existsSync(__viewRoot)) {
    __viewRoot = dftViews
  }
  return function(url, data, notrender){
    let tempPath = path.join(__viewRoot, `${url}.html`)
    if (!fs.existsSync(tempPath)) {
      tempPath = path.join(dftViews, `${url}.html`)
    }
    const temp = fs.readFileSync(tempPath, 'utf-8')
    if (notrender) return fkp.template(temp, data)
    ctx.body = fkp.template(temp, data, {
      root: __viewRoot,
      imports: {
        log: console.log
      }
    })
  }
}