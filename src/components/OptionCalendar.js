import React, { PureComponent } from 'react';

import { format, addMonths, endOfMonth, endOfWeek, subMonths, startOfWeek, startOfMonth, endOfYesterday, isSameMonth, addDays, isSameDay, isAfter, isBefore, parseISO } from 'date-fns';
import ruLocale from 'date-fns/locale/ru';

import Icon28ArrowLeftOutline from '@vkontakte/icons/dist/28/arrow_left_outline';
import Icon28ArrowRightOutline from '@vkontakte/icons/dist/28/arrow_right_outline';
import Icon28BlockOutline from '@vkontakte/icons/dist/28/block_outline';
import Icon28RemoveCircleOutline from '@vkontakte/icons/dist/28/remove_circle_outline';


export default class OptionCalendar extends PureComponent {
    constructor(props) {
      super(props)
      this.state = {
        currentDateCalendar: props.currentDate,
      }
      this.onDateClick = this.onDateClick.bind(this)
      this.nextMonth = this.nextMonth.bind(this)
      this.prevMonth = this.prevMonth.bind(this)
    }
  
    onDateClick = (day) => {
      this.props.blockDay(day);
    }
    nextMonth = () => {
      this.setState({ currentDateCalendar: addMonths(this.state.currentDateCalendar, 1) })
    }
    prevMonth = () => {
      this.setState({ currentDateCalendar: subMonths(this.state.currentDateCalendar, 1) })
    }
  
    renderHeader = () =>
      <div className="row calendar_header">
        <div className="calendar_header_col-start">
          <div className="calendar_header_icon icon" onClick={this.prevMonth}>
            <Icon28ArrowLeftOutline />
          </div>
        </div>
        <div className="calendar_header_col-center">
          <span>{format(this.state.currentDateCalendar, "LLLL yyyy", {locale: ruLocale})}</span>
        </div>
        <div className="calendar_header_col-end">
          <div className="calendar_header_icon icon" onClick={this.nextMonth}>
            <Icon28ArrowRightOutline />
          </div>
        </div>
      </div>
  
    renderDays = () =>
      <div className="row calendar_daysNames">
        <div className="col" key={0}>{this.props.platform[0] ? "Пнд" : "Понедельник"}</div>
        <div className="col" key={1}>{this.props.platform[0] ? "Втр" : "Вторник"}</div>
        <div className="col" key={2}>{this.props.platform[0] ? "Срд" : "Среда"}</div>
        <div className="col" key={3}>{this.props.platform[0] ? "Чтв" : "Четверг"}</div>
        <div className="col" key={4}>{this.props.platform[0] ? "Птн" : "Пятница"}</div>
        <div className="col" key={5}>{this.props.platform[0] ? "Сбт" : "Суббота"}</div>
        <div className="col" key={6}>{this.props.platform[0] ? "Вск" : "Воскресенье"}</div>
      </div>
  
    renderCells = () => {
      const { weekDay,period,blockedDays,currentDate } = this.props
      const { currentDateCalendar } = this.state
      const monthStart = startOfMonth(currentDateCalendar)
      const monthEnd = endOfMonth(monthStart)
      const startDate = startOfWeek( monthStart, {weekStartsOn: 1})
      const endDate = endOfWeek(monthEnd)
  
      let rows = []
      let days = []
      let day = startDate
      let formattedDate = ""
  
      while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
          formattedDate = format(day, "d", {locale: ruLocale})
          const cloneDay = format(day,'yyyy-MM-dd')
          const isToday = (isSameDay(day, currentDate))
          const isSelected = blockedDays.includes(cloneDay)
  
          days.push(
            <div
              className={`col calendar_body_cell calendar_body_cell_option
                ${ (!isSameMonth(day, monthStart)) ? "another" : "" }
                ${ (isSelected) ? "unselected" : "" }
                ${ (!weekDay[i]) ? "freeday" : "" }
                ${ (isBefore(day, endOfYesterday(currentDate))) ? "pastday" : "" }
                ${ (isBefore(day, parseISO(period[0])) || isAfter(day, parseISO(period[1])) ) ? "endday" : "" }
              `}
              key={ cloneDay }
              onClick={() => { this.onDateClick(cloneDay) } }
            >
              <div className="row">
                <span className={`calendar_body_cell_number ${(isToday)?"today":""}`}>
                  {formattedDate}
                </span>
                <div className="calendar_body_cell_icon">
                  { (isSelected) ? <Icon28BlockOutline /> : <Icon28RemoveCircleOutline /> }
                </div>
              </div>
            </div>
          )
          day = addDays(day, 1)
        }
        rows.push(<div className="row" key={format(day, 'yyyy-MM-ww')}>{days}</div>)
        days = []
      }
      return <div className="calendar_body">{rows}</div>
    }
  
    render = () =>
      <div className="calendar setting_wrap">
        {this.renderHeader()}
        {this.renderDays()}
        {this.renderCells()}
      </div>
  }