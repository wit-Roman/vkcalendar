import React from 'react';
import { connect } from 'react-redux';
import { loading, changePanel, bridgeAddToComm } from '../store.js';

import {Panel, PanelHeader, PanelHeaderButton, Title, Button, Group, InfoRow, Cell, Avatar} from '@vkontakte/vkui';
import Icon24Users from '@vkontakte/icons/dist/24/users';
import Icon28HomeOutline from '@vkontakte/icons/dist/28/home_outline';
import Icon28ChevronRightCircleOutline from '@vkontakte/icons/dist/28/chevron_right_circle_outline';
import Promopage from '../components/Promopage.js';


const Homepage = (props) =>
	<Panel id={props.id}>
		<PanelHeader
			className={(props.platform[1]==='mobile_web')&& 'PanelHeader-mob-settingButton'}
			left={<PanelHeaderButton><Icon28HomeOutline /></PanelHeaderButton>}
			right={!!props.viewer_id &&
			 <PanelHeaderButton onClick={() => { props.changePanel(1) }}>
				<Icon28ChevronRightCircleOutline />
			 </PanelHeaderButton>}
		>
			<Title level={props.platform[0]?"3":"2"} weight="regular">Приложение "Календарь посещений"</Title>
		</PanelHeader>

		<Group title={ !props.group_id ? "Выбрать группу" : "Уже установлено" }>
			<Cell expandable onClick={() => { !!props.group_id&& props.changePanel(1) }} >
				<InfoRow header="Текущая группа: ">
					{ (!!props.group_id && !!props.group_id ) ? 
					<div>
						<Avatar className="inline" src={props.fetchedGroup.photo_100} alt={props.fetchedGroup.name} size={24} /> ид:{props.group_id}, название:{props.fetchedGroup.name}
					</div>
					: 'не выбрана' }
				</InfoRow>
			</Cell>
			<Cell>
				<Button size="xl" level="2"
					mode={ !props.group_id && "primary"}
					onClick={() => { props.loading(); props.bridgeAddToComm(); }}>
					<Icon24Users className="inline" fill="#FFFFFF" /> Установить приложение в группу
				</Button>
			</Cell>
		</Group>
		<Group title="Описание">
			<Promopage />
		</Group>
	</Panel>


const mapStateToProps = ({ fetchedGroup, group_id, viewer_id, platform }) =>
	({ fetchedGroup, group_id, viewer_id, platform });

const mapDispatchToProps = dispatch => ({
	loading: () => dispatch( loading(), 'LOAD'),
	changePanel: (panelNum) => dispatch( changePanel(panelNum), 'PANEL'),
	bridgeAddToComm: () => dispatch( bridgeAddToComm(), 'ADDCOM')
});

export default connect(mapStateToProps, mapDispatchToProps)(Homepage);