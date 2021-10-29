import * as echarts from '../../ec-canvas/echarts';

const app = getApp();

var chart
var timerID

/*配置图表样式*/
function setOption(chart) {
  var option = {
    title: {
      text: '力-速度',
      left: 'center'
    },
   legend: {
      data: [{ name: 'F1', icon: 'circle', }, { name: 'F2', icon: 'circle'}],
      //top: 20,
      left: 'right',
      backgroundColor: 'transparent',
    },
    tooltip: {
      show: true,
      trigger: 'axis',//坐标轴触发
      hideDelay: 4000,//浮层隐藏的延迟，单位为 ms
      confine: true,//将tooltip框限制在图表的区域内(显示在左上角)
      //position: ['70%', '10%'],// 相对容器位置
      //formatter: '{a0}: {c0}\n{a1}: {c1}'
      /*formatter: function (params) {
        params = params[0];
        //var date = new Date(params.name);
        //return date+ ' : ' + params.value[1];
      }*/
    },

    xAxis: {
      type: 'value',
      name: '导体旋转速度',
      nameLocation: 'middle',
      nameGap: 20,//坐标轴名称与轴线之间的距离
      minInterval: 1,
      axisPointer: {
        axis: 'x',//指示器的坐标轴
        label: {
          show: true,//坐标轴指示器的文本标签
          margin: 20//label 距离轴的距离
        }
      },
      splitLine: {
        show: false
      },
      snap: true//坐标轴指示器自动吸附到点上
      // data: xdata
    },
    yAxis: {
      type: 'value',
      minInterval: 1,//整数显示
      //boundaryGap: ['0%', '100%'],
      splitLine: {
        show: false
      },
    },
    series: [{
      name: 'F1',
      type: 'scatter',
      symbolSize: 5,
      itemStyle: {
        color: '#ed3f14',//红
        borderColor: '#ed3f14',
      },
      data: app.globalData.data1
    }, {
      name: 'F2',
      type: 'scatter',
      symbolSize: 5,
      itemStyle: {
        color: '#2d8cf0',//蓝
        borderColor: '#2d8cf0',
        },
        data: app.globalData.data2
    }],
    dataZoom: [{//缩放
      type: 'inside',
      //orient:'vertical',
      xAxisIndex: [0],// 表示这个 dataZoom 组件控制xAxis
      filterMode: 'none'//不过滤数据，只改变数轴范围
    }],
    
    /*工具栏*/
    // toolbox: {
    //   show: true,
    //   left: 'left',
    //   feature: {
    //     dataZoom: {
    //       yAxisIndex: 'none',
    //     },
    //     dataView: { readOnly: false },
    //     magicType: { type: ['line', 'bar'] },
    //     restore: { show: true },
    //     saveAsImage: { show: true }
    //   }
    // },
  };
  chart.setOption(option);
}

Page({
  data: {
    ec: {
      lazyLoad: true
    },
    curve: 'curve-h',
    isRotating:'',//屏幕是否旋转
    hidden:false,//是否隐藏功能按钮 横屏隐藏
    value:app.globalData.v2,//手动控制转速显示值
    suspend:false,//是否中止绘图
    stat:"暂停绘图",
    showData: "F1:\t" + app.globalData.f1 + "\nF2:\t" + app.globalData.f2 + "\nV:\t" + app.globalData.v2
  },

  /*初始化图像*/
  initChart: function() {
    this.component.init((canvas, width, height) => {
      //删除const解决了chart.setOption is not a function的问题
      chart = echarts.init(canvas, null, {
        width: width,
        height: height
      });
      canvas.setChart(chart);
      setOption(chart);
      return chart;
    })
  },

  /*定时器更新数据 */
  timer: function() {
    var that=this;
    return setInterval(function () {
      if (app.globalData.v2 != null) {
        //app.globalData.data1.shift();
        app.globalData.data1.push([app.globalData.v2,app.globalData.f1])
        //app.globalData.data2.shift();
        app.globalData.data2.push([app.globalData.v2,app.globalData.f2])
        //调试用
        // var kk = Math.random() * 1000;
        // app.globalData.data1.push([kk, Math.random() * 1000]);
        // app.globalData.data2.push([kk, Math.random() * 1000]);
        if(that.data.isRotating) {
          that.setData({ 
            showData: "F1:\t" + app.globalData.f1 + "\tF2:\t" + app.globalData.f2 + "\tV:\t" + app.globalData.v2})
        }
        else {
          that.setData({ 
            showData: "F1:\t" + app.globalData.f1 + "\nF2:\t" + app.globalData.f2 + "\nV:\t" + app.globalData.v2})
        }
        chart.setOption({
          series: [{ data: app.globalData.data1 }, { data: app.globalData.data2 }],
        });
      }
    }, 1000)
  },

  /*清空图像*/
  cleanCurve: function () {
    app.globalData.data1 = [];
    app.globalData.data2 = [];
    chart.setOption({
      series: [{ data: app.globalData.data1 }, { data: app.globalData.data2 }],
    });
  },

  /*switch控制暂停绘图*/
  // switchChange: function (e) {
  //   console.log('switch 发生 change 事件，携带值为', e.detail.value)
  //   if(!e.detail.value){
  //     clearInterval(timerID);
  //   }
  //   else { timerID=this.timer();}
  //   this.setData({
  //     switch01: e.detail.value
  //   })
  // },

  changeStat:function() {
    if(this.suspend) {//绘图
      this.suspend=false;
      app.globalData.noSaveAll = true;//不允许保存所有数据
      timerID = this.timer();
      this.setData({
        stat:"暂停绘图"
      })
    }
    else {//暂停绘图
      this.suspend=true;
      clearInterval(timerID);
      app.globalData.noSaveAll = false;//允许保存所有数据
      this.setData({
        stat:"恢复绘图"
      })
    }
  },

  /*自动测量开启*/
  autoon: function () {
    app.senddata(0xAA, 0x55, 0xF9, 0x00, 0xff, 0xF7);
  },
  /*自动测量关闭*/
  autooff: function () {
    app.senddata(0xAA, 0x55, 0xF9, 0x00, 0x00, 0xF8);
  },

  /*手动控制转速*/
  handleChange(e) {
    console.log('手动控制转速',e)
    // app.senddata(0xAA,0x55,0xF4,0x00,0x00,0xF3);
    // app.senddata(0xAA,0x55,0xF4,0x00,0x00,0xF3);
    // app.senddata(0xAA,0x55,0xF4,0x00,0x00,0xF3);
    var that=this
    if (this.data.value > e.detail.value) { 
      console.log('手动减小转速')
      app.senddata(0xAA, 0x55, 0xF4, 0x00, 0x03, 0xF6); }  
    else {
      console.log('手动增加转速')
      app.senddata(0xAA, 0x55, 0xF4, 0x00, 0x05, 0xF8);
    }
    that.setData({
      value: app.globalData.v2
    })
  },

  
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //this.setData({ canvas: 'ec-canvas-h' })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    this.component = this.selectComponent('#mychart-dom-line'); 
    chart=this.initChart();
    timerID = this.timer()
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    let that = this;
    wx.onWindowResize(function (res) {
      console.log(res.size)
      if (res.deviceOrientation === 'landscape') {//横屏
        that.data.isRotating = true;
        wx.hideTabBar({})//隐藏菜单栏
        that.setData({ 
          curve: 'curve-f',
          hidden:true,
          showData: "F1:\t" + app.globalData.f1 + "\tF2:\t" + app.globalData.f2 + "\tV:\t" + app.globalData.v2
          })
        //chart.resize()//没用
        that.initChart();
      } else {//portrait竖屏
        that.data.isRotating = false;
        wx.showTabBar({})//显示菜单栏
        that.setData({ 
          curve: 'curve-h',
          hidden:false,
          showData: "F1:\t" + app.globalData.f1 + "\nF2:\t" + app.globalData.f2 + "\nV:\t" + app.globalData.v2
         })
        that.initChart();
      }
      console.log('是否旋转' + that.data.isRotating)
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
});