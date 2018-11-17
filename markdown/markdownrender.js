// var marked = require('marked')
// var render = new marked.Renderer()
var whiteListPropsAry = ['id', 'class', 'div', 'excute']
var re = / *\{(.*?)\} *(?:\n+|$)/; // "fjdskg  {abc: xxx} {xyz: yyy}" 取 " {....}"
var re_g = / *\{(.*)\}/g
var re_g_test = /^(\*|\-).*(?=( *\{))/g
var re_g_li = /<li>(\{.*?\})\s*<\/li>\s*/
var re_whiteList = / *['|"]?(id|class|div|desc)['|"]? *: *['"\w@;: \-_\u0391-\uFFE5]+/ig; // 只允许id 和 class

// function escape(html, encode) {
//   return html
//     .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;')
//     .replace(/"/g, '&quot;')
//     .replace(/'/g, '&#39;')
// }

// function unescape(html) {
// 	// explicitly match decimal, hex, and named HTML entities
//   return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/g, function(_, n) {
//     n = n.toLowerCase()
//     if (n === 'colon') return ':'
//     if (n.charAt(0) === '#') {
//       return n.charAt(1) === 'x'
//         ? String.fromCharCode(parseInt(n.substring(2), 16))
//         : String.fromCharCode(+n.substring(1))
//     }
//     return ''
//   })
// }

// 解析类似JSON的字符串，并合并成新的属性JSON
function getAsset (str) {
  var attrObj = {}
  const gatherAry = str.match(re)
  if (gatherAry) {
    var attrs = unescape(gatherAry[0])
    attrs = attrs.replace(/['" ]/ig, '')
    var validAttrs = attrs.match(re_whiteList)
    if (validAttrs) {
      validAttrs.forEach(function (item, ii) {
        const kv = item.split(':')
        attrObj[kv[0]] = kv[1]
      })
    }
  }
  return attrObj
}

// 解析自定义的属性数据
function customParse (str, spec) {
  var tmp_str = str
  if (spec === 'ul') {
    str = _.unescape(str)
    var config = str.match(re_g_li)
    if (config && config.length) {
      str = str.replace(config[0], '')
      tmp_str = str
      var _obj = getAsset(config[1])
      return [tmp_str, _obj]
    }
  }else {
    if (re_g_test.test(tmp_str)) {
      tmp_str = tmp_str.replace(re_g, '')
    }
    var _obj = getAsset(str)
    return [tmp_str, _obj]
  }
}

function whiteListProps (props, type) {
  var str = ''
  for (var item in props) {
    switch (item) {
      case 'div':
        break
      default:
        if (whiteListPropsAry.indexOf(item) > -1) str += ' ' + item + '="' + props[item] + '"'
    }
  }
  return str
}

export default function(render) {
  render.link = function (href, title, text) {
    var config = {}
    var id = ''
    var cls = ''

    if (this.options.sanitize) {
      try {
        var prot = decodeURIComponent(unescape(href)).replace(/[^\w:]/g, '').toLowerCase()
      } catch (e) {
        return
      }
      if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) return
    }

    if (title) {
      if (title.indexOf(' {') > -1) {
        var rtn = customParse(title)
        title = rtn[0]
        config = rtn[1]
      } else config = {}
    }

    var out = '<a' + whiteListProps(config) + ' href="' + href + '"'

    if (title) {
      out += ' title="' + title + '"'
    }
    out += '>' + text + '</a>'
    return out
  }

  render.hr = function (cls) {
    if (cls) {
      return this.options.xhtml ? '<hr class="' + cls + '"/>\n' : '<hr class="' + cls + '">\n'
    } else {
      return this.options.xhtml ? '<hr/>\n' : '<hr>\n'
    }
  }

  render.image = function (href, title, text) {
    var config = {}
    var id = ''
    var cls = ''

    if (title) {
      if (title.indexOf(' {') > -1) {
        var rtn = customParse(title)
        title = rtn[0]
        config = rtn[1]
      } else config = {}
    }

    var out = '<img' + whiteListProps(config) + ' src="' + href + '" alt="' + text + '"'
    if (title) out += ' title="' + title + '"'
    out += this.options.xhtml ? '/>' : '>'
    return out
  }

  render.heading = function (text, level, raw) {
    var config = {}

    if (raw) {
      if (raw.indexOf(' {') > -1) {
        var rtn = customParse(raw)
        text = rtn[0]
        config = rtn[1]
      } else config = {}
    }

    // var id = config.id || this.options.headerPrefix + raw.toLowerCase().replace(/[^\\w]+/g, '-')
    var id
    if (/[\u4e00-\u9fa5]/g.test(raw)) id = config.id || _.uniqueId('fkp-anchor-')
    else {
      id = config.id || this.options.headerPrefix + raw.toLowerCase().replace(/[^\\w]+/g, '-')
    }
    if (!id || id === '-') id = _.uniqueId('fkp-anchor-')
    var cls = config.class ? ' class="' + config.class + '"' : ''
    var desc = config.desc ? '<small>' + config.desc + '</small>' : ''
    return '<h' + level + ' id="' + id + '"' + cls + '>' + text + desc + '</h' + level + '>'
  }

  render.listitem = function (text) {
    var id = ''
    var cls = ''
    var config

    if (text) {
      if (text.indexOf(' {') > -1) {
        var rtn = customParse(text)
        text = rtn[0]
        config = rtn[1]
      } else config = {}
    }

    var ckboxStr = ''
    if (text.indexOf('[]') === 0) {
      text = text.replace('[]', '')
      ckboxStr = '<input type="checkbox">'
    }
    if (text.indexOf('[x]') === 0) {
      text = text.replace('[x]', '')
      ckboxStr = '<input type="checkbox" checked>'
    }
    return '<li' + whiteListProps(config) + '>' + ckboxStr + text + '</li>\n'
  }

  render.list = function (body, ordered) {
    var asset = {}
    var id = ''
    var cls = ''

    if (body) {
      if (body.indexOf('<li>{') > -1) {
        var rtn = customParse(body, 'ul')
        if (rtn) {
          body = rtn[0]
          asset = rtn[1]
        }
      }
    }

    var type = ordered ? 'ol' : 'ul'
    var template = ''

    if (asset.div) {
      template = '<' + type + '>' + body + '</' + type + '>'
      if (body) template = '<div ' + whiteListProps(asset, 'ul') + '>' + template + '</div>'
      else {
        template = '<div ' + whiteListProps(asset, 'ul') + '></div>'
      }
      return template
    }
    else if (asset.excute) {
      if (_.has(Excute, asset.excute)) {
        let _id = _.uniqueId('excute')
        let tmp = {}
        tmp[_id] = Excute[asset.excute]
        SAX.append('Excute', tmp)
        template = '<div ' + whiteListProps(asset, 'ul') + '>~~' + _id + '~~</div>'
        return template
      }
    }else {
      template = '<' + type + whiteListProps(asset) + '>' + body + '</' + type + '>'
      return template
    }
  }

  return render
}
