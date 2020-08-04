import React, { Component } from "react";
import { connect } from "react-redux";
import { changePanel, apiRequestChange, apiConnect } from "../store.js";

import {
  format,
  addMonths,
  subMonths,
  getWeeksInMonth,
  startOfWeek,
  startOfMonth,
  endOfYesterday,
  isSameMonth,
  addDays,
  isSameDay,
  isAfter,
  isBefore,
  parse,
} from "date-fns";
import ruLocale from "date-fns/locale/ru";

import {
  Panel,
  PanelHeader,
  PanelHeaderButton,
  Title,
  Group,
  Cell,
  Avatar,
  Snackbar,
} from "@vkontakte/vkui";

import Icon28ArrowLeftOutline from "@vkontakte/icons/dist/28/arrow_left_outline";
import Icon28ArrowRightOutline from "@vkontakte/icons/dist/28/arrow_right_outline";
import Icon24UserOutgoing from "@vkontakte/icons/dist/24/user_outgoing";
import Icon28ChevronBack from "@vkontakte/icons/dist/28/chevron_back";
import Icon24UserOutline from "@vkontakte/icons/dist/24/user_outline";
import Icon24User from "@vkontakte/icons/dist/24/user";
import Icon24UserAdded from "@vkontakte/icons/dist/24/user_added";
import Icon24Settings from "@vkontakte/icons/dist/24/settings";
import Icon28CancelCircleOutline from "@vkontakte/icons/dist/28/cancel_circle_outline";

class Calendar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentDateCalendar: props.currentDate,
      snackbar: null,
    };
    //this.onDateClick = this.onDateClick.bind(this);
    this.nextMonth = this.nextMonth.bind(this);
    this.prevMonth = this.prevMonth.bind(this);
  }

  componentDidUpdate() {
    if (this.props.autoUpd && !this.props.AutoUpdEnabled)
      this.props.apiConnect(this.props.activePanel === "calendar");
  }

  componentWillUnmount() {
    this.props.apiConnect(false);
  }

  onDateClick = (day, innactive) => {
    const { accessMember, rights, group_id } = this.props;

    if (!group_id) {
      this.openSnackbar("Приложение не установлено в группу");
      return false;
    }
    if (accessMember && rights < 1) {
      this.openSnackbar("Только участники сообщества могут записаться");
      return false;
    }
    if (innactive) {
      return false;
    } else {
      this.props.apiRequestChange(day);
    }
  };

  openSnackbar = (text) => {
    if (this.state.snackbar) return;
    this.setState({
      snackbar: (
        <Snackbar
          layout="vertical"
          onClose={() => this.setState({ snackbar: null })}
          before={<Icon28CancelCircleOutline />}
        >
          {text}
        </Snackbar>
      ),
    });
  };

  nextMonth = () => {
    this.setState({
      currentDateCalendar: addMonths(this.state.currentDateCalendar, 1),
    });
  };
  prevMonth = () => {
    this.setState({
      currentDateCalendar: subMonths(this.state.currentDateCalendar, 1),
    });
  };

  renderHeader = () => (
    <div className="row calendar_header">
      <div className="calendar_header_col-start">
        <div className="calendar_header_icon icon" onClick={this.prevMonth}>
          <Icon28ArrowLeftOutline />
        </div>
      </div>
      <div className="calendar_header_col-center">
        <span>
          {format(this.state.currentDateCalendar, "LLLL yyyy", {
            locale: ruLocale,
          })}
        </span>
      </div>
      <div className="calendar_header_col-end">
        <div className="calendar_header_icon icon" onClick={this.nextMonth}>
          <Icon28ArrowRightOutline />
        </div>
      </div>
    </div>
  );

  renderDays = () => (
    <div className="row calendar_daysNames">
      <div className="col" key={0}>
        {this.props.platform[0] ? "Пнд" : "Понедельник"}
      </div>
      <div className="col" key={1}>
        {this.props.platform[0] ? "Втр" : "Вторник"}
      </div>
      <div className="col" key={2}>
        {this.props.platform[0] ? "Срд" : "Среда"}
      </div>
      <div className="col" key={3}>
        {this.props.platform[0] ? "Чтв" : "Четверг"}
      </div>
      <div className="col" key={4}>
        {this.props.platform[0] ? "Птн" : "Пятница"}
      </div>
      <div className="col" key={5}>
        {this.props.platform[0] ? "Сбт" : "Суббота"}
      </div>
      <div className="col" key={6}>
        {this.props.platform[0] ? "Вск" : "Воскресенье"}
      </div>
    </div>
  );

  renderUsers = (cloneDay) => {
    const { selectedDates, sessions } = this.props;

    let result = [];
    Object.entries(selectedDates).forEach((user) => {
      user[1].forEach((date) => {
        if (cloneDay === date) {
          if (typeof sessions[user[0]] === "undefined") return;
          const profile = sessions[user[0]];
          result.push(
            <div key={user[0]} className="calendar_body_cell_item">
              <a
                href={"https://vk.com/id" + profile.viewer_id}
                title={profile.first_name + " " + profile.last_name}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Avatar
                  src={profile.photo_100}
                  alt={profile.first_name + " " + profile.last_name}
                  size={24}
                />
              </a>
            </div>
          );
        }
      });
    });

    return result;
  };

  renderCells = () => {
    const {
      selectedUserDates,
      weekDay,
      period,
      blockedDays,
      currentDate,
    } = this.props;
    const { currentDateCalendar } = this.state;
    const weeksNum = getWeeksInMonth(currentDateCalendar, { weekStartsOn: 1 });
    let day = startOfWeek(startOfMonth(currentDateCalendar), {
      weekStartsOn: 1,
    });

    return (
      <div className="calendar_body">
        {Array.apply(null, Array(weeksNum)).map((element, weekCount) => (
          <div className="row" key={weekCount}>
            {Array.apply(null, Array(7)).map((elem, dayCount) => {
              const cloneDay = format(day, "yyyy-MM-dd");
              const users = this.renderUsers(cloneDay);
              const dayIsIncludes = selectedUserDates.includes(cloneDay);
              const isToday = isSameDay(day, currentDate);
              const isCurrentMonth = !isSameMonth(day, currentDateCalendar);
              const innactive =
                (blockedDays.includes(cloneDay)) ||
                !weekDay[dayCount] ||
                isBefore(day, endOfYesterday(currentDate)) ||
                isBefore(
                  day,
                  parse(period[0], "yyyy-MM-dd", new Date(), {
                    locale: ruLocale,
                  })
                ) ||
                isAfter(
                  day,
                  parse(period[1], "yyyy-MM-dd", new Date(), {
                    locale: ruLocale,
                  })
                );

              const displayDay = format(day, "d", { locale: ruLocale });
              day = addDays(day, 1);

              return (
                <div
                  className={`col calendar_body_cell ${
                    isCurrentMonth && "another"
                  } ${dayIsIncludes && "selected"} ${
                    innactive && "unselected"
                  } `}
                  key={dayCount}
                >
                  <div
                    className={`row calendar_body_cell_control ${
                      innactive && "innactive"
                    }`}
                    onClick={() => {
                      this.onDateClick(cloneDay, innactive);
                    }}
                  >
                    <span
                      className={`calendar_body_cell_icon ${
                        innactive
                          ? "innactive"
                          : dayIsIncludes
                          ? "red"
                          : "green"
                      }`}
                    >
                      {!innactive ? (
                        dayIsIncludes ? (
                          <Icon24UserOutgoing fill="#4986cc" />
                        ) : (
                          <Icon24UserAdded fill="#70b014" />
                        )
                      ) : dayIsIncludes ? (
                        <Icon24User fill="#70b014" />
                      ) : (
                        <Icon24UserOutline fill="#4986cc" />
                      )}
                    </span>
                    <span className="calendar_body_cell_count">
                      {users.length > 0 ? users.length : " "}
                    </span>
                    <span
                      className={`calendar_body_cell_number ${
                        isToday && "today"
                      }`}
                    >
                      {displayDay}
                    </span>
                  </div>
                  <div className="calendar_body_cell_users_wrap">
                    <div className="calendar_body_cell_users">{users}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  render = () => (
    <Panel id={this.props.id}>
      <PanelHeader
        className={
          this.props.platform[1] === "mobile_web" &&
          "PanelHeader-mob-settingButton"
        }
        left={
          <PanelHeaderButton
            onClick={() => {
              this.props.changePanel(0);
            }}
          >
            <Icon28ChevronBack />
          </PanelHeaderButton>
        }
      >
        <Title
          style={{ marginLeft: 0 }}
          level={this.props.platform[1] === "mobile_web" ? "3" : "2"}
          weight="regular"
        >
          Посещения
        </Title>
      </PanelHeader>
      <Group title="Выбрать день">
        {this.props.rights > 1 && (
          <Cell
            onClick={() => {
              this.props.changePanel(2);
            }}
            indicator={
              <>
                <Icon24Settings className="inline" />
                &nbsp;
                <span style={{ position: "relative", top: "-6px" }}>
                  Настройки
                </span>
              </>
            }
            expandable
          />
        )}
        <Cell>
          <div className="calendar">
            {this.renderHeader()}
            {this.renderDays()}
            {this.renderCells()}
          </div>
        </Cell>
      </Group>

      {this.state.snackbar}
    </Panel>
  );
}

const mapStateToProps = ({
  group_id,
  group_role,
  viewer_id,
  fetchedUser,
  selectedDates,
  sessions,
  selectedUserDates,
  accessMember,
  autoUpd,
  weekDay,
  period,
  blockedDays,
  currentDate,
  AutoUpdEnabled,
  activePanel,
  rights,
  platform,
}) => ({
  group_id,
  group_role,
  viewer_id,
  fetchedUser,
  selectedDates,
  sessions,
  selectedUserDates,
  accessMember,
  autoUpd,
  weekDay,
  period,
  blockedDays,
  currentDate,
  AutoUpdEnabled,
  activePanel,
  rights,
  platform,
});

const mapDispatchToProps = (dispatch) => ({
  changePanel: (panelNum) => dispatch(changePanel(panelNum), "PANEL"),
  apiRequestChange: (day) => dispatch(apiRequestChange(day), "CHNG"),
  apiConnect: (is_open) => dispatch(apiConnect(is_open), "UPD"),
});

export default connect(mapStateToProps, mapDispatchToProps)(Calendar);
