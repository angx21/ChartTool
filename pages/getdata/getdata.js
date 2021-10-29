const app = getApp()
const { $Toast } = require('../../iview-weapp/base/index');
var Autoinstr
Page({

  /**
   * 页面的初始数据
   */
  data: {
    origindata:app.globalData.bledata,
    
    currData: {f1:app.globalData.f1,f2:app.globalData.f2,v2:app.globalData.v2},//实时数据
    storeData: [],//定点数据
    storef1: '',//定点f1
    storef2: '',//定点f2
    storev2: '',//定点v2
    hiddenStore:true,//隐藏定点数据表
    hiddenModal1: true,
    hiddenModal2: true,
    smoothing:'',//滤波常数
    num:'',//自动测量组数
    max:'',//自动测量最大速度
    fileTransfor:false,//传输格式是否为定点数据
    getexdata:false,//不允许获取定点数据
    noSaveAll:app.globalData.noSaveAll//不允许保存所有数据
  },

  /*ArrayBuffer转16进度字符串示例*/
  ab2hex: function (buffer) {
    const hexArr = Array.prototype.map.call
      (new Uint8Array(buffer),
      function (bit) {
        return ('00' + bit.toString(16)).slice(-2)
      })
    return hexArr.join('')
  },

  /*开始接收数据*/
  getdata:function(){
    var that=this;
    wx.onBLECharacteristicValueChange(function (res) {
      if(res!=null){
        // that.setData({
        //   origindata: that.ab2hex(res.value),
        // })
        //上传格式为定点数据
        if(that.data.fileTransfor) {
          that.setData({
            currData: {
              f1: '',
              f2: '',
              v2: ''
            }
          })
          var tempbledata = that.ab2hex(res.value)
          if(parseInt(tempbledata[0]+tempbledata[1]+tempbledata[2]+tempbledata[3],16)==0xaaf4) {
            app.globalData.bledata=[];
          }
          app.globalData.bledata += tempbledata
        }

        else {
          //上传格式为实时数据
          app.globalData.bledata = that.ab2hex(res.value)
          //实时v2
          app.globalData.v2 = parseInt(app.globalData.bledata[26] + app.globalData.bledata[27] + app.globalData.bledata[28] + app.globalData.bledata[29], 16);
          //实时f1
          if (parseInt(app.globalData.bledata[14],16) & 0x8 == 0x8){
            app.globalData.f1 = -(0xffff & (~parseInt(app.globalData.bledata[14] + app.globalData.bledata[15] + app.globalData.bledata[16] + app.globalData.bledata[17], 16)) + 1);
        } 
          else app.globalData.f1 = parseInt(app.globalData.bledata[14] + app.globalData.bledata[15] + app.globalData.bledata[16] + app.globalData.bledata[17], 16);
          //实时f2
          if (parseInt(app.globalData.bledata[18], 16) & 0x8 == 0x8) {
            app.globalData.f2 = -(0xffff & (~parseInt(app.globalData.bledata[18] + app.globalData.bledata[19] + app.globalData.bledata[20] + app.globalData.bledata[21], 16)) + 1);
          }
          else app.globalData.f2 = parseInt(app.globalData.bledata[18] + app.globalData.bledata[19] + app.globalData.bledata[20] + app.globalData.bledata[21], 16);
          that.setData({
            currData:{
              f1:app.globalData.f1,
              f2:app.globalData.f2,
              v2: app.globalData.v2
            }
          })
          console.log('characteristic value comed:', app.globalData.bledata)
        }
    }
    })
  },

  /*设置对话框*/
  showModal1: function (e) {
    this.setData({ hiddenModal1: false })
  },
  showModal2: function (e) {
    this.setData({ hiddenModal2: false })
  },

  /*输入合法性检验 没用到*/
  check:function(exp,str){
    var res=exp.test(str);
    if(res) {
      return true
    }
    else {
      $Toast({
        content: '请输入合法数值',
        type: 'warning'
      });
    }
  },

  /*获取输入框信息*/
  //获取滤波常数
  getSmoothing: function (e) {
    console.log('滤波次数输入: ',e)
    var val = parseInt(e.detail.value, 10);
    this.data.smoothing = val
  },
  //获取自动测量组数
  getNum: function (e) {
    console.log('自动测量组数输入: ', e)
    var val = parseInt(e.detail.value, 10);
    this.data.num = val
  },
  //获取最大速度
  getMax: function (e) {
    console.log('最大速度输入: ', e)
    var val = parseInt(e.detail.value, 10) / 10;
    this.data.max = val
  },

  /*检测设置是否超出范围*/
  checkLimit: function (num,a, b) {
    if ( num> b || num < a) {
      $Toast({
        content: '请输入合法数值',
        type: 'warning'
      });
      return true;
    }
    else return false;
  },

  /*设置滤波常数*/
  confirm1: function () {
    var that = this;
    if (that.checkLimit(that.data.smoothing,1,16)) {
      this.setData({ hiddenModal1: true })
      return;
    }
    var sum = 0xff & (0xAA + 0x55 + 0xF5 + 0x00 + that.data.smoothing)
    var ok=app.senddata(0xAA, 0x55, 0xF5, 0x00, that.data.smoothing, sum);
    this.setData({ hiddenModal1: true })
    if(ok){
      wx.showToast({
      title: '设置命令已发送',
      icon: 'none'
      })
    }
  },
  /*设置自动测量参数*/
  confirm2: function (e) {
    var that=this;
    console.log(that.data.num, that.data.max)
    if (that.checkLimit(that.data.num, 10, 100) || that.checkLimit(that.data.max, 10, 250)) {
      this.setData({ hiddenModal2: true })
      return;
    }
    var sum=0xff&(0xAA+0x55+0xF8+that.data.num+that.data.max)
    var ok=app.senddata(0xAA, 0x55, 0xF8, that.data.num, that.data.max, sum);
    this.setData({ hiddenModal2: true })
    if (ok) {
      wx.showToast({
        title: '设置命令已发送',
        icon: 'none'
      })
    }
  },
  cancel1: function (e) {
   var that=this;
    this.setData({ hiddenModal1: true })
    wx.showToast({
      title: '已取消',
      icon: 'none'
    })
  },
  cancel2: function (e) {
    var that = this;
    this.setData({ hiddenModal2: true })
    wx.showToast({
      title: '已取消',
      icon: 'none'
    })
  },

  setTransform01: function () {//设置数据上传格式为格式1
    app.senddata(0xAA, 0x55, 0xF2, 0x01, 0x01, 0xF3);
  },

  /*获取定点数据*/
  getStoreData() {
    var that = this
    that.data.storeData=[];
    
    //避免重复点击
    this.setData({
      getexdata:true
    })
    wx.showToast({
      title: '正在获取...',
      icon: 'loading',
      duration: 2000,
      mask: true
    })
    //设置数据上传格式为格式4
    var ok=app.senddata(0xAA, 0x55, 0xF2, 0x00, 0x04, 0xF5);
    that.data.fileTransfor=true;
    
    //从下位机获取
    //延迟等待接收完毕
    setTimeout(function () {
      console.log("所有定点数据: "+app.globalData.bledata);
      var m=3;var n=1;
      while(app.globalData.bledata[m+3]!=null) {
        //定点v2
        that.storev2 = parseInt(app.globalData.bledata[m+13] + app.globalData.bledata[m+14] + app.globalData.bledata[m+15] + app.globalData.bledata[m+16], 16);
        //定点f1
        if (parseInt(app.globalData.bledata[m+1], 16) & 0x8 == 0x8) {
          that.storef1 = -(0xffff & (~parseInt(app.globalData.bledata[m+1] + app.globalData.bledata[m+2] + app.globalData.bledata[m+3] + app.globalData.bledata[m+4], 16)) + 1);
        }
        else that.storef1 = parseInt(app.globalData.bledata[m+1] + app.globalData.bledata[m+2] + app.globalData.bledata[m+3] + app.globalData.bledata[m+4], 16);
        //定点f2
        if (parseInt(app.globalData.bledata[m+5], 16) & 0x8 == 0x8) {
          that.storef2 = -(0xffff & (~parseInt(app.globalData.bledata[m+5] + app.globalData.bledata[m+6] + app.globalData.bledata[m+7] + app.globalData.bledata[m+8], 16)) + 1);
        }
        else that.storef2 = parseInt(app.globalData.bledata[m+5] + app.globalData.bledata[m+6] + app.globalData.bledata[m+7] + app.globalData.bledata[m+8], 16);

        console.log(that.storef1+"="+that.storef2+"="+that.storev2)
        that.data.storeData.push({ id: n, f1: that.storef1, f2: that.storef2, v2: that.storev2 })
        m=m+16;n=n+1;
      }

      //显示定点数据表
      if (that.data.storeData!=[]) {
        that.setData({
          hiddenStore:false,
          storeData:that.data.storeData
        })
      }
      else {
        console.log('无定点数据')
        $Toast({
          content: '无定点数据',
          type: 'warning'
        });
        return;
      }

      //此时开始允许接收
      that.setData({
        getexdata:false
      })
      that.data.fileTransfor=false;
      that.setTransform01();//设置为数据上传格式为格式1
    }, 1500)
    
    //写入文件 deviceName+"定点数据.txt"
    var name = app.globalData.deviceName + "定点数据.txt"
    var i=0;
    var dataWrite='id\tv\tf1\tf2\n';
    while (that.data.storeData[i]) {
      dataWrite = dataWrite + that.data.storeData[i].id + '\t' + that.data.storeData[i].v2+'\t'+ that.data.storeData[i].f1 + '\t' + that.data.storeData[i].f2 +'\n'
      i++;
    }
    this.saveFile(dataWrite, name)
  },

  /*获取AppId*/
  getAppId: function () {
    this.data.appId = wx.getAccountInfoSync().miniProgram.appId;
    console.log(this.data.appId);
  },

  /*二维数组转字符串 没用到*/
  dataToString:function(arr) {
    var str='';
    for (var row = 0; row < arr.length; row++) {
      str = str+arr[row].join("\t");
      str = str+"\n"
    }
    return str;
  },

  /*data1,data2转字符串,去掉重复的v2*/
  dataToStr:function(arr1,arr2) {
    var str = '';
    for (var row = 0; row < arr1.length; row++) {
      str = str + arr1[row].join("\t")+"\t"+arr2[row][1];
      str = str + "\n"
    }
    return str;
  },

  /*保存文件*/
  saveFile:function(str,name) {
    // 在本地用户文件目录下创建一个文件 name，写入内容 str
    const fs = wx.getFileSystemManager()
    var that = this
    fs.writeFile({// 文件路径: 'MicroMsg/wxanewfiles/...'
      filePath: `${wx.env.USER_DATA_PATH}/`+name,
      data: str,
      encoding: 'utf8',
      complete: function (res) {
        console.log(res)
      },
      fail:function(res) {
        console('无法获取写文件权限')
        wx.showModal({
          title: '错误',
          content: '无法获取读写文件权限',
          showCancel: false,
          success(res) {
            if (res.confirm) {
            }
          }
        })
      }
    })

    wx.saveFile({// 文件存储路径: 'MicroMsg/wxafiles/appId/...'
      tempFilePath: `${wx.env.USER_DATA_PATH}/`+name,
      //filePath: `${wx.env.USER_DATA_PATH}/.txt`,
      complete: function (res) {
        console.log(res)
      },
      fail:function(res) {
        wx.showModal({
          title: '错误',
          content: '抱歉! 出现未知错误...',
          showCancel: false,
          success(res) {
            if (res.confirm) {
            }
          }
        })
      },
      success: function (res) {
        //重命名前的文件名
        var prename = res.savedFilePath
        prename = prename.slice(9)//prename.substring(3)
        prename = prename.substr(0,prename.length-4);

        fs.rename({
          oldPath: res.savedFilePath,
          newPath: "wxfile://"+name,
          complete: function (res) {
            console.log(res)
          },
          success:function(res) {
            wx.showModal({
              title: '提示',
              content: '文件已经存至\n tencent/MicroMsg/wxafiles/' + that.data.appId +'/'+ name,
              showCancel: false,
              success(res) {
                if (res.confirm) {
                }
              }
            })
          },
          fail:function(res) {
            wx.showModal({
              title: '警告',
              content: '无法获取文件系统修改权限!!!\n\n'
                + '文件临时存至\n\n tencent/MicroMsg/wxafiles/' + that.data.appId +'/'+prename+'\n\n'
                +'修改后缀名为.txt即可正常打开\n\n'
                +'请尽早另行保存',
              showCancel: false,
              success(res) {
                if (res.confirm) {
                }
              }
            })
          }
        })

        //读取文件
        // fs.readFile({
        //   filePath:res.savedFilePath,
        //   encoding:'utf8',
        //   complete: function (res) {
        //     console.log(res)
        //   }
        // })
      }
    })
  },

  /*保存所有数据为 deviceName+"所有数据.txt"*/
  saveAll:function() {
    //console.log('data1: ', app.globalData.data1)
    //console.log('data2: ', app.globalData.data2)
    var name = app.globalData.deviceName + "所有数据.txt"
    var dataWrite = "v\tf1\tf2\n"+this.dataToStr(app.globalData.data1, app.globalData.data2)
    this.saveFile(dataWrite,name)
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.getAppId()
    this.getdata();//接收数据
    this.setTransform01();//设置为数据上传格式为格式1
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      noSaveAll:app.globalData.noSaveAll
    })
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