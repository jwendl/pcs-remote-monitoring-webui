// Copyright (c) Microsoft. All rights reserved.

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as actions from '../../actions';
import MapPane from './mapPane';
import Flyout, { Header, Body } from '../../framework/flyout/flyout';
import DeviceDetail from '../deviceDetail/deviceDetail';
import Spinner from '../spinner/spinner';

import './deviceMap.css';

class DeviceMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingMap: true
    };
  }

  componentDidMount() {
    this.createScript(
      'https://www.bing.com/api/maps/mapcontrol?callback=loadMap'
    );
  }

  componentWillReceiveProps(nextProps) {
    const { devices } = nextProps;
    if (devices && devices.length) {
      this.setState({ loadingMap: false }, () => {
        this.showMap(devices);
      });
    }
  }

  showMap(devices) {
    const { mapkey, actions } = this.props;
    MapPane.init(mapkey);
    MapPane.setData({
      deviceData: devices,
      container: this,
      actions
    });
    let data = this.getDeviceData(devices);
    MapPane.setDeviceLocationData(
      data.minLat,
      data.minLong,
      data.maxLat,
      data.maxLong,
      data.locationList
    );
  }

  showFlyout = () => {
    this.refs.flyout.show();
  };

  getDeviceData(data) {
    let Location = function(deviceId) {
      this.deviceId = deviceId;
      this.latitude = null;
      this.longitude = null;
      this.status = null;
    };
    let minLat;
    let maxLat;
    let minLong;
    let maxLong;
    let offset = 0.05;
    let mapData = {};
    let longitudes = [];
    let latitudes = [];
    let locationList;
    if (data && data.length) {
      locationList = data.map(function(item, i) {
        let location = new Location(item.DeviceId);
        if (item.DeviceId.match(/10_/)) {
          location.status = 1;
        } else if (item.DeviceId.match(/6_/)) {
          location.status = 2;
        } else {
          location.status = 0;
        }
        let latitude = (location.latitude =
          item['reported.Device.Location.Latitude']);
        let longitude = (location.longitude =
          item['reported.Device.Location.Longitude']);
        latitudes.push(Number(latitude));
        longitudes.push(Number(longitude));
        return location;
      });
    }
    minLat = Math.min.apply(null, latitudes.filter(e => !isNaN(e)));
    maxLat = Math.max.apply(null, latitudes.filter(e => !isNaN(e)));
    minLong = Math.min.apply(null, longitudes.filter(e => !isNaN(e)));
    maxLong = Math.max.apply(null, longitudes.filter(e => !isNaN(e)));

    // TODO: check mark validate data after API integration
    if (locationList && locationList.Count === 0) {
      minLat = 47.6;
      maxLat = 47.6;
      minLong = -122.3;
      maxLong = -122.3;
    }
    mapData.minLat = minLat - offset;
    mapData.maxLat = maxLat + offset;
    mapData.minLong = minLong - offset;
    mapData.maxLong = maxLong + offset;
    mapData.locationList = locationList;
    return mapData;
  }

  createScript(src) {
    return new Promise((resolve, reject) => {
      let script = document.createElement('script');
      script.src = src;
      script.addEventListener('load', function() {
        resolve();
      });
      script.addEventListener('error', function(e) {
        reject(e);
      });
      document.body.appendChild(script);
    });
  }

  render() {
    return (
      <div className="bing-map">
        {this.state.loadingMap &&
          <div className="loading-spinner">
            <Spinner />
          </div>}
        <div id="deviceMap" className="dashboard_device_map" />
        <Flyout ref="flyout">
          <Header>Device Detail</Header>
          <Body>
            <DeviceDetail />
          </Body>
        </Flyout>
      </div>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return {
    actions: bindActionCreators(actions, dispatch)
  };
};

export default connect(null, mapDispatchToProps)(DeviceMap);
