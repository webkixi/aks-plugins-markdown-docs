const path = require('path')

module.exports = {
  name: 'mds',  // 指定文档静态文件输出根目录

  // 允许使用的tag关键字
  accessKey: [
    'tags',
    'cats',
    'css',
    'js',
    'author',
    'desc',
    'about',
    {'分类': 'cats'},   //支持中文 key
    {'作者': 'author'}
  ],

  pageData: {},  // 自定义需要传入模板中的变量

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
  },

  imgRoot: path.join(CONFIG.ROOT, 'aotoodocs/images'),
  routerSet: [
    {
      urlPrefix: '/docs',
      src: path.join(CONFIG.ROOT, 'aotoodocs/docs'),
    }
  ]
}