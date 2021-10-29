// pages/bleconnect/bleconnect.js
const app = getApp()
var serviceId = []
var characteristicId = []
var bleEnabled = false
Page({
  /**
   * 页面的初始数据
   */
  data: {
    bleDevice:[],//搜索到的蓝牙设备组
    bkcolor: '#ED3F14',//提示背景色
    stat:'未连接',
    switch1:false,
    loading:false,//页底加载动画
    bleDevice_temp:[]//连接成功后搜索到的设备不显示，这里临时保存，在ble断开时重新给页面显示
  },
  
  onChange(e) {
    if(e.detail.value) {
      this.getSystemInfo();
      console.log("var bleEnabled = " + this.bleEnabled);
      if(!this.bleEnabled) return;
    }
    this.setData({
      'switch1': e.detail.value
    })
    if(e.detail.value) {
      this.final();
    }
    else{
      this.closeBle(true);//显示 "关闭成功" 提示
    }
  },

  reset:function(){
    this.closeBle(false);//不显示 "关闭成功" 提示
    this.final();
  },

  justClose:function(){
    this.setData({
      'switch1': false
    })
    this.closeBle(false);//不显示 "关闭成功" 提示
  },

  final:function(){
  //  this.closeBle();
    this.openBle();
    if(!this.bleEnabled)return;
    this.searchBle();
    console.log(this.data.bleDevice)
  },

  /* 获取位置信息 */
  getSystemInfo: function () {  //部分安卓机型需要打开定位服务才可使用BLE
    var that  =this
    wx.getSystemInfo({
      success: (result) => {
        if(!result.bluetoothEnabled) {
          wx.showModal({
            title: '提示',
            content: '检测到当前蓝牙关闭，请打开系统蓝牙',
            showCancel:false
          })
          that.bleEnabled = false //此时蓝牙不可用
        }
        else if(!result.locationEnabled) {
          wx.showModal({
            title: '提示',
            content: '为确保能够使用低功耗蓝牙，请打开定位服务',
            showCancel:false
          })
          that.bleEnabled = false //此时蓝牙不可用
        }
        else {
          that.bleEnabled = true //此时蓝牙可用
        }
      },
    })
  },

  /* 打开蓝牙 */
  openBle: function (){
    var that = this
    //初始化蓝牙模块
    wx.openBluetoothAdapter({
      success(res) {
        console.log('初始化蓝牙模块成功：',res)
        that.bleEnabled = true //此时蓝牙可用
        //获取本机蓝牙适配器状态
        wx.getBluetoothAdapterState({
          success: function (res) {
          console.log('本机蓝牙适配器状态：',res)
          }
        })
      },
      fail(res) {
        console.log(res)
        wx.showModal({
          title: '提示',
          content: '蓝牙不可用，请检查系统蓝牙是否打开',
          showCancel:false
        })
        that.bleEnabled = false //此时蓝牙不可用
        that.justClose();
      }
    })
  },

  searchBle: function () {
    var that = this;
    //开始搜寻附近的蓝牙外围设备
    wx.startBluetoothDevicesDiscovery({
      success: function (res) {
        console.log('开始搜索周边蓝牙设备')
        that.data.bleDevice=[];
        wx.getBluetoothDevices({//获取设备信息
          success: function (res) {
            console.log(res)
            var i = 0;
            while (res.devices[i]) {
              console.log(i, res.devices[i].name, res.devices[i].deviceId);
              //用setData渲染
              var tempname = 'bleDevice[' + i + '].name';//这里使array的下标可以动态改变
              var tempid = 'bleDevice[' + i + '].id'; 
              that.setData({
                [tempname]:res.devices[i].name,
                [tempid]:res.devices[i].deviceId
              })
              i++;
            }
            that.onFoundDevice();
          }
        })
      }
    })
  },
  /*监听寻找到新设备的事件*/
  onFoundDevice:function() {
    var that=this;
    wx.onBluetoothDeviceFound(function (res) {
      console.log('new device list has founded: ', res.devices)
      //console.dir(devices)
      var i=0;
      while(res.devices[i]) {
        if(res.devices[i].name=="") {
          that.data.bleDevice.push({
            name: "未知设备",
            id: res.devices[i].deviceId
          })
        }
        else{
          that.data.bleDevice.push({
            name: res.devices[i].name,
            id: res.devices[i].deviceId
          })
        }
        i++;
      }
      console.log('此时bleDevice: ',that.data.bleDevice)
      //loading动画
      that.setData({
        loading:true
      })
      setTimeout(function () {
        that.setData({
          loading: false
        })
      }, 800)
      that.setData({
        bleDevice:that.data.bleDevice
      })
    })
  },
  
  /*页面点击获取deviceId*/
  getDeviceId:function(e) {
    console.log('点击操作返回信息: ',e)
    app.globalData.deviceId = e.currentTarget.dataset.id;
    app.globalData.deviceName = e.currentTarget.dataset.name;
    console.log('获取name-id: ', app.globalData.deviceName, app.globalData.deviceId);
    this.connectBle();
  },

  /*连接蓝牙*/
  connectBle: function () {
    var that = this
    wx.showToast({
      title: '正在连接...',
      icon: 'loading',
      duration: 10000,
      mask: true
    })
    wx.createBLEConnection({
      deviceId: app.globalData.deviceId,
      success(res) {
        console.log(res);
        that.getService();
      },
      fail(res) {
        console.log('连接失败: ',res);
        that.failConn();
      }
    })
  },

  getService: function () {
    var that = this
    wx.getBLEDeviceServices({//获取一个设备的所有服务并储存到serviceId数组里去
      deviceId: app.globalData.deviceId,
      complete: function (res) {
        console.log('已获取设备服务信息: ',res.services);
        var i = 0;
        while (res.services[i]) {
          serviceId[i] = res.services[i].uuid
          console.log(serviceId[i]);
          i++;
        }
        if (serviceId) {
          that.getCharacteristics();
        }
      }
    })
  },
  
  /*针对一个特定服务查看这个服务所支持的操作*/
  getCharacteristics: function () {
    var that = this
    wx.getBLEDeviceCharacteristics({
      deviceId: app.globalData.deviceId,
      serviceId: serviceId[1],
      success: function (res) {
        var i = 0;
        while (res.characteristics[i]) {
          characteristicId[i] = res.characteristics[i].uuid;
          console.log(res.characteristics[i].properties);
          i++;
        }
        setTimeout(function () {
          that.notifyBle();
        }, 500)
      }
    })
  },

  /*监听数据*/
  notifyBle: function ()
  {
    var that = this
    wx.notifyBLECharacteristicValueChange({
      state: true,
      deviceId: app.globalData.deviceId,
      serviceId: serviceId[1],
      characteristicId: characteristicId[0],
      success: function (res) {
        console.log('notifyBLECharacteristicValueChange success', res.errMsg)
        app.globalData.serviceId = serviceId[1];
        app.globalData.characteristicId = characteristicId[0];
        //停止搜寻附近的蓝牙外围设备
        wx.stopBluetoothDevicesDiscovery({
          success(res) {
            console.log('已经停止搜寻附近的蓝牙外围设备',res)
          }
        })
        wx.showToast({
          title: '连接成功',
          icon: 'succes',
          duration: 800,
          mask: true
        })
        that.data.bleDevice_temp = that.data.bleDevice
        that.setData({
          bkcolor: "#19BE6B",
          stat: '已连接到: '+app.globalData.deviceName,
          bleDevice:[]
        })
        wx.showTabBar({})//显示菜单栏

        //蓝牙连接状态的改变事件
        wx.onBLEConnectionStateChange(function(res) {
          console.log('ble连接状态的改变',res)
          if (!res.connected) { 
            that.setData({
              bkcolor: "#ED3F14",
              stat: "连接已断开",
              bleDevice: app.data.bleDevice_temp
            })
          }
        })
        //跳转页面
        setTimeout(function () {
          wx.switchTab({
            url: "/pages/getdata/getdata"
          })
        }, 600)
      },
      fail:function(res) {
        console.log('监听数据失败',res)
        that.failConn();
      }
    })
  },

  /*断开蓝牙连接 暂时没用到*/
  closeBleconnection: function () {
    var that = this
    wx.closeBLEConnection({
      deviceId: app.globalData.deviceId,
      success(res) {
        console.log(res)
      }
    })
  },

  /*关闭蓝牙模块*/
  closeBle: function (show) {
    var that = this
    //调用该方法将断开所有已建立的连接并释放系统资源
    wx.closeBluetoothAdapter({
      success(res) {
        console.log(res)
        that.setData({ bleDevice: [] })
        //var temp = JSON.stringify(res)//将对象转换为字符串
        if(show) {
          wx.showToast({
          title: '关闭成功',
          icon: 'succes',
          duration: 1000,
          mask: true
          })
        }
        that.setData({
          bkcolor: "#ED3F14",
          stat: "未连接"
        })
      }
    })
  },

  /*连接失败*/
  failConn:function() {
    var that=this
    wx.hideToast({})
    wx.showModal({
      title: '提示',
      content: '连接失败，即将重试',
      confirmText: '确定',
      showCancel: 'false',
      success(res) {
        if (res.confirm) {
          that.reset();
        }
      }
    })
    that.setData({
      bkcolor: "#ED3F14",
      stat: "未连接"
    })
  },

  /*wx.getConnectedBluetoothDevices//根据 uuid 获取处于已连接状态的设备
({
    success: function (res) 
    {
      console.log('已连接的蓝牙设备:')
      console.log(JSON.stringify(res.devices));
      //that.setData({connectedDeviceId: res.deviceId})
    }
})*/
  //that.setData({devices: res.devices})
  
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    wx.hideTabBar({})//隐藏菜单栏
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function (options) {
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})