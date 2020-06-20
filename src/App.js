import React, { Component } from 'react';
import { connect } from 'react-redux';
import { loading, bridgeConnect, apiRequestData, apiConnect } from './store.js';
import View from '@vkontakte/vkui/dist/components/View/View';
import ScreenSpinner from '@vkontakte/vkui/dist/components/ScreenSpinner/ScreenSpinner';
import Homepage from './panels/Homepage';
import Calendar from './panels/Calendar';
import Settings from './panels/Settings';
import { withPlatform, ANDROID, IOS } from '@vkontakte/vkui'
import '@vkontakte/vkui/dist/vkui.css';
import './style.css';


class App extends Component {
	componentDidMount = () => {
		const { platform } = this.props;
		(async () => {
			if( !this.props.viewer_id && this.props.BridgeLoading ) {
				this.props.loading();
				await this.props.bridgeConnect(platform);
			}
			if( !!this.props.group_id && this.props.CalendarLoading ) {
				this.props.loading();
				await this.props.apiRequestData();
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
		})()
	}

	render = () =>
		<View 
			activePanel={this.props.activePanel} 
			popout={this.props.StoreLoading&& <ScreenSpinner size='large' />}
		>
			<Homepage id="homepage" />
			<Calendar id="calendar" />
			<Settings id="settings" />
		</View>
}

const mapStateToProps = ({ activePanel, group_id, group_role, viewer_id, autoUpd, StoreLoading, BridgeLoading, CalendarLoading, AutoUpdEnabled }) =>
	({ activePanel, group_id, group_role, viewer_id, autoUpd, StoreLoading, BridgeLoading, CalendarLoading, AutoUpdEnabled });

const mapDispatchToProps = dispatch => ({
	loading: () => dispatch( loading(), 'LOAD'),
	bridgeConnect: (platform) => dispatch( bridgeConnect(platform), 'BRIDGE'),
  	apiRequestData: () => dispatch( apiRequestData(), 'DATA'),
	apiConnect: (is_open) => dispatch( apiConnect(is_open), 'UPD')
});
  
export default connect(mapStateToProps, mapDispatchToProps)( withPlatform(App) );