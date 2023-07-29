import {useSetState} from 'ahooks';
import Base, { UseSessionListProps } from './base';

// interface Data<T> {
//   chromeStorageKey: string;
//   initialData: Session<T>[]
// }

export default function<T extends YATab | ChromeTab>({ chromeStorageKey = '', initialData = []}: UseSessionListProps<T>){
  return Base<T>({ useSetState, chromeStorageKey, initialData });
}
