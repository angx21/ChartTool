//app.js
App({
  globalData:{
    userInfo: null,
    deviceId: '',//ble设备id
    deviceName:'',//ble设备名称
    serviceId:'',
    characteristicId:'',
    bledata:'',//ble获取的原始数据
    f1: '',
    f2: '',
    v2: '',
    data1:[],
    data2:[],
    noSaveAll:true//不允许保存所有数据
  },
  
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },

  /*写数据*/
  senddata: function (s1, s2, s3, s4, s5, s6) {
    var that=this;
    const buffer = new ArrayBuffer(6)
    const dataView = new DataView(buffer)
    dataView.setUint8(0, s1)
    dataView.setUint8(1, s2)
    dataView.setUint8(2, s3)
    dataView.setUint8(3, s4)
    dataView.setUint8(4, s5)
    dataView.setUint8(5, s6)
    wx.writeBLECharacteristicValue({
      deviceId: this.globalData.deviceId,
      serviceId: this.globalData.serviceId,
      characteristicId: this.globalData.characteristicId,
      value: buffer,
      success(res) {
        console.log('writeBLECharacteristicValue success', res.errMsg)
        return true;
      },
      fail(res) {
        console.log('writeBLECharacteristicValue fail',res)
        that.unSend();
        return false;
      }
    })
  },

  /*像蓝牙设备发送数据失败*/
  unSend:function() {
    wx.showModal({
      title: '错误',
      content: '出现错误! 请检查蓝牙设备或重新连接',
      showCancel: false,
      success(res) {
        if (res.confirm) {
          wx.switchTab({
            url: "/pages/bleconnect/bleconnect"
          })
        }
      }
    })
  }
})
