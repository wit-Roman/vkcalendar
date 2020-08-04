import React, { Component } from "react";
import { connect } from "react-redux";
import {
  loading,
  bridgeConnect,
  apiRequestData,
  apiConnect,
  apiUserGroups,
} from "./store.js";
import View from "@vkontakte/vkui/dist/components/View/View";
import ScreenSpinner from "@vkontakte/vkui/dist/components/ScreenSpinner/ScreenSpinner";
import Snackbar from "@vkontakte/vkui/dist/components/Snackbar/Snackbar";
import Icon28CancelCircleOutline from "@vkontakte/icons/dist/28/cancel_circle_outline";
import Homepage from "./panels/Homepage";
import Calendar from "./panels/Calendar";
import Settings from "./panels/Settings";
import { withPlatform } from "@vkontakte/vkui";
import "@vkontakte/vkui/dist/vkui.css";
import "./style.css";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      snackbar: null,
    };
  }

  componentDidMount = () => {
    (async () => {
      if (!this.props.viewer_id && this.props.BridgeLoading) {
        this.props.loading();
        await this.props.bridgeConnect(this.props.platform);
        this.props.apiUserGroups(this.props.viewer_id);
      }

      if (!!this.props.group_id && this.props.CalendarLoading) {
        this.props.loading();
        const answ = await this.props.apiRequestData();

        if (!answ) {
          if (this.state.snackbar) return;
          this.setState({
            snackbar: (
              <Snackbar
                layout="vertical"
                onClose={() => this.setState({ snackbar: null })}
                before={<Icon28CancelCircleOutline />}
              >
                Внешний зарос на сервер был заблокирован
              </Snackbar>
            ),
          });
        }
      }

      /*if ( this.props.autoUpd && !this.props.AutoUpdEnabled ) {
				if ( this.props.activePanel === 'calendar' ) {
					console.log( "connect" )
					this.props.apiConnect(true);
				} else {
					console.log( "disconnect" );
					this.props.apiConnect(false);
				}
			}*/
    })();
  };

  render = () => (
    <View
      activePanel={this.props.activePanel}
      popout={
        (this.state.snackbar,
        this.props.StoreLoading && <ScreenSpinner size="large" />)
      }
    >
      <Homepage id="homepage" />
      <Calendar id="calendar" />
      <Settings id="settings" />
    </View>
  );
}

const mapStateToProps = ({
  activePanel,
  group_id,
  group_role,
  viewer_id,
  autoUpd,
  StoreLoading,
  BridgeLoading,
  CalendarLoading,
  AutoUpdEnabled,
}) => ({
  activePanel,
  group_id,
  group_role,
  viewer_id,
  autoUpd,
  StoreLoading,
  BridgeLoading,
  CalendarLoading,
  AutoUpdEnabled,
});

const mapDispatchToProps = (dispatch) => ({
  loading: () => dispatch(loading(), "LOAD"),
  bridgeConnect: (platform) => dispatch(bridgeConnect(platform), "BRIDGE"),
  apiRequestData: () => dispatch(apiRequestData(), "DATA"),
  apiConnect: (is_open) => dispatch(apiConnect(is_open), "UPD"),
  apiUserGroups: (viewer_id) => dispatch(apiUserGroups(viewer_id), "USERGROUP"),
});

export default connect(mapStateToProps, mapDispatchToProps)(withPlatform(App));
