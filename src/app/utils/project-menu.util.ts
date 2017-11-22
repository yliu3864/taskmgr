import {
  TaskVM,
  TaskListVM,
  TaskHistoryVM
} from '../vm';
import { TaskHistory } from '../domain';
import { getDateDesc } from './history.util';
import * as DateFns from 'date-fns';
import * as History from '../domain/history';

export const getUnassignedTasks = (taskListVMs: TaskListVM[]): TaskVM[] => {
  //Get All Tasks
  let taskVMs: TaskVM[] = getTaskVMs(taskListVMs);

  //Filter Unassigned Tasks (No Owner & Not Completed)
  taskVMs = taskVMs.filter((taskVM: TaskVM) => !taskVM.owner && !taskVM.completed);

  //Sort By Create Date
  taskVMs = taskVMs.sort((currentTask: TaskVM, nextTask: TaskVM) => {
    const currentTimestamp: number = new Date(<Date>currentTask.createDate).getTime();
    const nextTimestamp: number = new Date(<Date>nextTask.createDate).getTime();
    return currentTimestamp - nextTimestamp;
  });

  return taskVMs;
}

export const getTodayTasks = (taskListVMs: TaskListVM[]): TaskVM[] => {
  //Get All Tasks
  let taskVMs: TaskVM[] = getTaskVMs(taskListVMs);

  //Filter Today Tasks (DueDate <= TodayDate & Not Completed)
  taskVMs = taskVMs.filter((taskVM: TaskVM) => {
    if (taskVM.dueDate && !taskVM.completed) {
      const nowDate: Date = new Date();
      const todayDate: Date = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());

      return todayDate.getTime() >= new Date(taskVM.dueDate).getTime();
    }
    return false;
  });

  //Sort By Create Date
  taskVMs = taskVMs.sort((currentTask: TaskVM, nextTask: TaskVM) => {
    const currentTimestamp: number = new Date(<Date>currentTask.createDate).getTime();
    const nextTimestamp: number = new Date(<Date>nextTask.createDate).getTime();
    return currentTimestamp - nextTimestamp;
  });

  return taskVMs;
}

export const getTaskVM = (taskId: string, taskListVMs: TaskListVM[]): TaskVM => {
  let taskVMs: TaskVM[] = getTaskVMs(taskListVMs);

  taskVMs = taskVMs.filter((taskVM: TaskVM) => taskVM.id === taskId);

  return taskVMs[0];
}

const getTaskVMs = (taskListVMs: TaskListVM[]): TaskVM[] => {
  return taskListVMs.reduce((acc: TaskVM[], value: TaskListVM) => {
    return [...acc, ...value.tasks];
  }, []);
}

export const getOwnerAvatar = (taskVM: TaskVM): string => {
  return taskVM.owner ? <string>taskVM.owner.avatar : 'unassigned';
}

export const getDueDateDesc = (date: Date): string => {
  const nowDate: Date = new Date();
  const dueDate: Date = new Date(date);
  const todayDate: Date = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  const yesterdayDate: Date = new Date(todayDate.getTime() - 24 * 60 * 60 * 1000);
  const thisWeekDate: Date = new Date(todayDate.getTime() - (nowDate.getDay() === 0 ? 6 : nowDate.getDay() - 1) * 24 * 60 * 60 * 1000);
  const lastWeekDate: Date = new Date(thisWeekDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  const dueTimestamp: number = dueDate.getTime();
  const thisWeekTimestamp: number = thisWeekDate.getTime();
  const lastWeekTimestamp: number = lastWeekDate.getTime();

  if (DateFns.format(nowDate, 'YYYY-MM-DD') === DateFns.format(dueDate, 'YYYY-MM-DD')) {
    return `今天 截止`;
  }

  if (DateFns.format(yesterdayDate, 'YYYY-MM-DD') === DateFns.format(dueDate, 'YYYY-MM-DD')) {
    return `昨天 截止`;
  }

  if (dueTimestamp >= thisWeekTimestamp) {
    return `本周${getDayName(dueDate.getDay())} 截止`;
  }

  if (dueTimestamp >= lastWeekTimestamp && dueTimestamp < thisWeekTimestamp) {
    return `上周${getDayName(dueDate.getDay())} 截止`;
  }

  return DateFns.format(date, 'M月D日 截止');
}

const getDayName = (day: number): string => {
  const dayNames: string[] = ['日', '一', '二', '三', '四', '五', '六'];
  return dayNames[day];
}

export const isPastDate = (date: Date): boolean => {
  const nowDate: Date = new Date();
  const todayDate: Date = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());

  let dueDate: Date = new Date(date);
  dueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  return todayDate.getTime() > dueDate.getTime();
}

export const isTodayDate = (date: Date): boolean => {
  const nowDate: Date = new Date();
  const todayDate: Date = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());

  return DateFns.format(nowDate, 'YYYY-MM-DD') === DateFns.format(new Date(date), 'YYYY-MM-DD');
}

export const isFutureDate = (date: Date): boolean => {
  const nowDate: Date = new Date();
  const todayDate: Date = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());

  let dueDate: Date = new Date(date);
  dueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  return todayDate.getTime() < dueDate.getTime();
}

//TODO: Invoke getDateDesc may return 'a couple of seconds/mins before' rather than 'today'
export const getChartDateDescs = (): string[] => {
  return getChartDates().map((date: Date) => {
    return getDateDesc(date).split(' ', 1)[0];
  });
}

export const getTaskHistoriesByTask = (taskHistories: TaskHistory[]): TaskHistory[][] => {
  //Filter & Sort By Date
  let histories: TaskHistory[] = getSortTaskHistories(taskHistories, true);

  //Convert TaskHistory[] To TaskHistory[][] By TaskId
  let historiesByTask: TaskHistory[][] = [];
  while (histories.length > 0) {
    let specifiedTaskHistories: TaskHistory[] = [];
    let comparedHistory: TaskHistory = <TaskHistory>histories.shift();
    specifiedTaskHistories.push(comparedHistory);
    console.log('<<COMPARED>>', histories.length, comparedHistory.taskId, JSON.stringify(comparedHistory.operation));
    histories.forEach((history: TaskHistory) => {
      if (history.taskId === comparedHistory.taskId) {
        specifiedTaskHistories.push(history);
        console.log('<<MATCHED>>', history.taskId, JSON.stringify(history.operation));
      }
    })
    histories = histories.filter((history: TaskHistory) => history.taskId !== comparedHistory.taskId);
    historiesByTask.push(specifiedTaskHistories);
  }

  console.log('<<>>', historiesByTask);

  /**
   * Convert TaskHistory[][] To number[][]
   * 0: Not Created Yet, Done, Deleted
   * 1: Created, Recreated
   */
  return historiesByTask;
}

export const getChartTotalNumbers = (taskHistoriesByTask: TaskHistory[][]): number[] => {
  let totalNumbers: number[] = [];
  const chartDates: Date[] = getChartDates();

  chartDates.forEach((chartDate: Date) => {
    const comparedTimestamp: number = chartDate.getTime() + 24 * 60 * 60 * 1000;
    let totalNumber: number = 0;

    taskHistoriesByTask.forEach((taskHistories: TaskHistory[]) => {
      let index = taskHistories.findIndex((history: TaskHistory) => comparedTimestamp < new Date(history.date).getTime());

      if (index < 0) {
        if (taskHistories[taskHistories.length - 1].operation.type != History.DELETE_TASK)
          totalNumber += 1;
      }
      else if (index === 0) {

      }
      else {
        if (taskHistories[index - 1].operation.type != History.DELETE_TASK)
          totalNumber += 1;
      }
    });

    totalNumbers.push(totalNumber);
  });

  console.log('<<Total Number>>', totalNumbers);

  return totalNumbers;
}

const getChartDates = (): Date[] => {
  const nowDate: Date = new Date();
  const todayDate: Date = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());

  let dates: Date[] = [];
  for (let i: number = 13; i >= 0; i--) {
    dates.push(new Date(todayDate.getTime() - i * 24 * 60 * 60 * 1000));
  }
  return dates;
}

export const getTaskHistories = (taskHistories: TaskHistory[], limit: number): TaskHistory[] => {
  const histories: TaskHistory[] = getSortTaskHistories(taskHistories, false);

  if (limit > 0 && histories.length > limit) {
    return histories.slice(0, limit);
  }

  return histories;
}

export const getTaskHistoryVMs = (histories: TaskHistory[]): TaskHistoryVM[] => {
  return histories.map((history: TaskHistory) => {
    const avatar: string = history.operator.avatar ? <string>history.operator.avatar : 'unassigned'
    const name: string = <string>history.operator.name;
    const dateDesc: string = getDateDesc(history.date);

    switch (history.operation.type) {
      case History.CREATE_TASK:
        return {
          ...history,
          icon: avatar,
          name: name,
          title: `创建了任务:`,
          content: `${history.operation.payload}`,
          dateDesc: dateDesc,
        };
      case History.COMPLETE_TASK:
        return {
          ...history,
          icon: avatar,
          name: name,
          title: `完成了任务:`,
          content: `${history.operation.payload}`,
          dateDesc: dateDesc,
        };
      case History.RECREATE_TASK:
        return {
          ...history,
          icon: avatar,
          name: name,
          title: `重做了任务:`,
          content: `${history.operation.payload}`,
          dateDesc: dateDesc,
        };
      case History.DELETE_TASK:
        return {
          ...history,
          icon: avatar,
          name: name,
          title: `删除了任务:`,
          content: `${history.operation.payload}`,
          dateDesc: dateDesc,
        };
      default:
        return {
          ...history,
          icon: avatar,
          name: name,
          title: `未知操作`,
          dateDesc: dateDesc,
        };
    }
  });
}

const getSortTaskHistories = (taskHistories: TaskHistory[], asc: boolean): TaskHistory[] => {
  let histories: TaskHistory[] = taskHistories.filter((taskHistory: TaskHistory) => {
    switch (taskHistory.operation.type) {
      case History.CREATE_TASK:
      case History.COMPLETE_TASK:
      case History.RECREATE_TASK:
      case History.DELETE_TASK:
        return true;
      default:
        return false;
    }
  });

  histories = histories.sort((currentHistory: TaskHistory, nextHistory: TaskHistory) => {
    const currentTimestamp: number = new Date(<Date>currentHistory.date).getTime();
    const nextTimestamp: number = new Date(<Date>nextHistory.date).getTime();
    return currentTimestamp - nextTimestamp;
  });

  return asc ? histories : histories.reverse();
}