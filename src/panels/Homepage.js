import React from "react";
import { connect } from "react-redux";
import {
  changePanel,
  bridgeAddToComm,
  apiRequestData,
  bridgeRequestGroups,
  bridgeRequestToken,
} from "../store.js";

import {
  Panel,
  PanelHeader,
  PanelHeaderButton,
  Title,
  Button,
  Group,
  InfoRow,
  List,
  Cell,
  Avatar,
  Link,
} from "@vkontakte/vkui";
import Icon24Users from "@vkontakte/icons/dist/24/users";
import Icon28ListPlayOutline from "@vkontakte/icons/dist/28/list_play_outline";
import Icon28CalendarOutline from "@vkontakte/icons/dist/28/calendar_outline";
import Promopage from "../components/Promopage.js";

const Homepage = (props) => (
  <Panel id={props.id}>
    <PanelHeader
      className={
        props.platform[1] === "mobile_web" && "PanelHeader-mob-settingButton"
      }
      left={
        <PanelHeaderButton
          title="Перейти в календарь"
          onClick={() => {
            props.changePanel(1);
          }}
        >
          <Icon28CalendarOutline />
        </PanelHeaderButton>
      }
    >
      <Title level={props.platform[0] ? "3" : "2"} weight="regular">
        О сервисе
      </Title>
    </PanelHeader>
    <Group title={!props.group_id ? "Выбрать группу" : "Уже установлено"}>
      <Cell
        expandable={!!props.group_id}
        onClick={() => {
          !!props.group_id && props.changePanel(1);
        }}
      >
        <InfoRow header="Текущая группа: ">
          {!!props.group_id ? (
            <div>
              {!props.fetchedGroup_name ? (
                "id:" + props.group_id
              ) : (
                <>
                  <Avatar
                    className="inline"
                    src={props.fetchedGroup_photo_100}
                    alt={props.fetchedGroup_name}
                    size={24}
                  />
                  &nbsp;&nbsp;id:&nbsp;{props.group_id},&nbsp;название:&nbsp;
                  {props.fetchedGroup_name}
                </>
              )}
            </div>
          ) : (
            "не выбрана"
          )}
        </InfoRow>
      </Cell>
      <Cell>
        <Button
          size="xl"
          level="2"
          mode="primary"
          onClick={() => {
            if (!props.viewer_id)
              window.location.href = "https://vk.com/app7121023";
            if (!!props.access_token) {
              props.bridgeAddToComm();
            } else {
              props.bridgeRequestToken().then((result) => {
                if (result) {
                  props.bridgeAddToComm();
                  props.bridgeRequestGroups();
                }
              });
            }
          }}
          before={<Icon24Users className="inline" />}
        >
          {!props.group_id
            ? "Установить приложение в группу"
            : "Установить в другую группу"}
        </Button>
      </Cell>
    </Group>

    <Group>
      <Cell>Ранее запись осуществлялась в следующих группах:</Cell>
      {!!props.access_token ? (
        <List>
          {!!props.userFetchedGroups &&
            !!props.userFetchedGroups.length &&
            props.userFetchedGroups.map((elem, index) => (
              <Cell
                className={
                  elem[0] === props.group_id ? "welcome_list_cell_current" : ""
                }
                key={index}
                expandable
                onClick={() => {
                  props.apiRequestData(elem[0], elem[4]);
                  props.changePanel(1);
                }}
              >
                <Avatar
                  className="inline-ava"
                  src={elem[3]}
                  alt={elem[1]}
                  size={24}
                />
                &nbsp;
                <Link
                  target="_blank"
                  href={"https://vk.com/public" + elem[0]}
                  alt="Открыть страницу группы"
                >
                  {"public" + elem[0]}
                </Link>
                , {elem[1]} {elem[2]}
              </Cell>
            ))}
        </List>
      ) : (
        <Cell>
          <Button
            size="xl"
            level="2"
            disabled={!props.viewer_id}
            onClick={() => {
              props.bridgeRequestToken().then((result) => {
                if (result) props.bridgeRequestGroups();
              });
            }}
            before={<Icon28ListPlayOutline className="inline" />}
          >
            Загрузить список
          </Button>
        </Cell>
      )}
    </Group>

    <Group title="Описание">
      <Promopage platform={props.platform} />
    </Group>
  </Panel>
);

const mapStateToProps = ({
  access_token,
  fetchedGroup_name,
  fetchedGroup_photo_100,
  userFetchedGroups,
  group_id,
  viewer_id,
  platform,
}) => ({
  access_token,
  fetchedGroup_name,
  fetchedGroup_photo_100,
  userFetchedGroups,
  group_id,
  viewer_id,
  platform,
});

const mapDispatchToProps = (dispatch) => ({
  changePanel: (panelNum) => dispatch(changePanel(panelNum), "PANEL"),
  bridgeAddToComm: () => dispatch(bridgeAddToComm(), "ADDCOM"),
  apiRequestData: (group_id, group_role) =>
    dispatch(apiRequestData(group_id, group_role), "DATA"),
  bridgeRequestToken: () => dispatch(bridgeRequestToken(), "TOKEN"),
  bridgeRequestGroups: () => dispatch(bridgeRequestGroups(), "USERGROUPINFO"),
});

export default connect(mapStateToProps, mapDispatchToProps)(Homepage);
