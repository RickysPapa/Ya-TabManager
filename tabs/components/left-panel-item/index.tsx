import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import type { MouseEventHandler, MouseEvent } from 'react';
import Input from 'antd/es/input';
import type { IWindow }  from '~/lib/new/WindowManager';
import { NOOP } from '~/lib/utils';
import { useBoolean } from 'ahooks';
import dayjs from "dayjs";

const { Search } = Input;

interface ILeftPanelItemProps {
  active: boolean;
  data: IWindow;
  onClick?: MouseEventHandler;
  updateInfo?: Function;
  remove?: MouseEventHandler;
}

export default function LeftPanelItem({ data, onClick = NOOP, updateInfo = NOOP, remove = NOOP, active = false }: ILeftPanelItemProps){
  if(!data){
    console.log('LeftPanelItem >>', data);
    return null;
  }
  const {id, createAt, name, closed} = data;
  const [alias, setAlias] = useState(name);
  const [editing, { setTrue, setFalse }] = useBoolean(false);
  return (
    <li key={id} className="window-item" onClick={onClick}>
      {closed === true
        ? (<span className="item-status item-status-closed" />)
        : (<span className="item-status item-status-opening" />)
      }
      {editing ? (
        <input
          value={alias}
          onInput={(e) => {
            // console.log('onInput >>', e.currentTarget.value);
            setAlias(e.currentTarget.value);
          }}
          autoFocus
          onKeyDown={(e) => {
            // console.log('onKeyDown >>', e.key);
            if(e.key === 'Enter'){
              setFalse();
              updateInfo({
                name: alias
              });
            }
          }}
        />
      ) : (
        <span style={{ fontWeight: active ? 'bold' : 'normal' }} >{alias || dayjs(createAt).format('YYYY/MM/DD HH:mm') || id}</span>
      )}
      <div className="window-item-options" >
        <span className={`iconfont icon-edit`} onClick={setTrue} />
        <span className={`iconfont icon-close`} onClick={remove} />
      </div>
    </li>
  );
}
