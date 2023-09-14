import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import type { MouseEventHandler, MouseEvent } from 'react';
import Input from 'antd/es/input';
import type { IWindow }  from '~/lib/new/WindowManager';
import { NOOP } from '~/lib/utils';
import { useBoolean } from 'ahooks';
import dayjs from "dayjs";


interface IGroupTabProps {
  cgid: string;
  cgname: string;
  count: number;
}

interface IGroupTabsProps {
  onTabClick: (cgid: string) => void;
}

export default function GroupTabs(props: IGroupTabProps){
  return (
    <div onTabClick={}>
      <span>{props.cgname}</span>
      <span>{props.count}</span>
    </div>
  );
}
