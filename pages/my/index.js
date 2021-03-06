// index.js
// 获取应用实例
var app = getApp()
const AV = app.AV;
const Todo = require('../../model/todo');

Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    todos: [],
    editedTodo: {},
    draft: '',
    editDraft: null,
  },
  //事件处理函数
  bindViewTap: function() {
    // wx.navigateTo({
    //   url: '../logs/logs'
    // })
  },
  syncUserInfo: function (user) {
    var that = this
    //调用应用实例的方法获取全局数据
    app.getUserInfo(function(userInfo){
      // 更新当前用户的信息
      user.set(userInfo).save().then(user => {
        // 成功，此时可在控制台中看到更新后的用户信息
        //that.globalData.user = user.toJSON();
      }).catch(console.error);
      //更新数据
      that.setData({
        userInfo:userInfo
      })
      app.aldstat.debug(userInfo.nickName)
    })
    // new app.AV.Query('Todo')
    //   .descending('createdAt')
    //   .find()
    //   .then(todos => that.setData({ todos }))
    //   .catch(console.error);
  },
  loginAndFetchTodos: function () {
    return AV.Promise.resolve(AV.User.current()).then(user =>
      user ? (user.isAuthenticated().then(authed => authed ? user : null)) : null
    ).then(user =>
      user ? user : AV.User.loginWithWeapp()
    ).then((user) => {
      console.log('uid', user.id);
      this.syncUserInfo(user)
      return new AV.Query(Todo)
        .equalTo('user', AV.Object.createWithoutData('User', user.id))
        .descending('createdAt')
        .find()
        .then(this.setTodos)
        .catch(console.error);
    }).catch(error => console.error(error.message));
  },
  onReady: function() {
    console.log('page ready');
    this.loginAndFetchTodos();
  },
  onPullDownRefresh: function () {
    this.loginAndFetchTodos().then(wx.stopPullDownRefresh);
  },
  setTodos: function (todos) {
    const activeTodos = todos.filter(todo => !todo.done);
    this.setData({
      todos,
      activeTodos,
    });
  },
  updateDraft: function ({
    detail: {
      value
    }
  }) {
    this.setData({
      draft: value
    });
  },
  addTodo: function () {
    var value = this.data.draft && this.data.draft.trim()
    if (!value) {
      return;
    }
    var acl = new AV.ACL();
    acl.setPublicReadAccess(false);
    acl.setPublicWriteAccess(false);
    acl.setReadAccess(AV.User.current(), true);
    acl.setWriteAccess(AV.User.current(), true);
    new Todo({
      content: value,
      done: false,
      user: AV.User.current()
    }).setACL(acl).save().then((todo) => {
      this.setTodos([todo, ...this.data.todos]);
    }).catch(console.error);
    this.setData({
      draft: ''
    });
  },
  toggleDone: function ({
    target: {
      dataset: {
        id
      }
    }
  }) {
    const { todos } = this.data;
    const currentTodo = todos.filter(todo => todo.id === id)[0];
    currentTodo.done = !currentTodo.done;
    currentTodo.save()
      .then(() => this.setTodos(todos))
      .catch(console.error);
  },
  editTodo: function ({
    target: {
      dataset: {
        id
      }
    }
  }) {
    this.setData({
      editDraft: null,
      editedTodo: this.data.todos.filter(todo => todo.id === id)[0] || {}
    });
  },
  updateEditedContent: function ({
    detail: {
      value
    }
  }) {
    this.setData({
      editDraft: value
    });
  },
  doneEdit: function ({
    target: {
      dataset: {
        id
      }
    }
  }) {
    const { todos, editDraft } = this.data;
    this.setData({
      editedTodo: {},
    });
    if (editDraft === null) return;
    const currentTodo = todos.filter(todo => todo.id === id)[0];
    if (editDraft === currentTodo.content) return;
    currentTodo.content = editDraft;
    currentTodo.save().then(() => {
      this.setTodos(todos);
    }).catch(console.error);
  },
  removeDone: function () {
    AV.Object.destroyAll(this.data.todos.filter(todo => todo.done)).then(() => {
      this.setTodos(this.data.activeTodos);
    }).catch(console.error);
  },
  setting: function () {
    wx.navigateTo({
      url: '../setting/setting',
    });
  },
})
