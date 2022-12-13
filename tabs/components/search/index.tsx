import { useEffect, useState, useMemo, useRef, DOMElement, useCallback } from "react";
import Input from 'antd/es/input';
import Fuse from 'fuse.js';

const { Search } = Input;

export default function TMSearch({ dataSource, onResult }){
  const searchEl = useRef(null);
  const inComposition = useRef(false);
  const value = useRef('');
  const _onSearch = useRef(null);

  const fuse = useMemo(() => {
    const searchData = dataSource.map(_ => _.title + _.url + '');
    console.log('pattern2 >>', dataSource, searchData);
    // const uf = new uFuzzy({});
    // const idxs = uf.filter(windowSearchSource, e.target.value);
    return new Fuse(searchData, {
      useExtendedSearch: true,
      threshold: 0,
      includeScore: true,
      includeMatches: true,
      findAllMatches: true
    });
  }, [dataSource]);

  const onSearch = useCallback((_v) => {
    const _input = _v.trim()
    if(_input){
      const pattern = `'${_input.split(' ').join(" '")}`
      console.log('pattern >>', pattern);
      const matches = fuse.search(pattern)
      console.log('pattern >>2', matches);
      const _list = matches.map(_ => dataSource[_.refIndex]);
      onResult(_list);
      return;
    }
    onResult(false);
  }, [fuse])

  useEffect(() => {
    _onSearch.current = onSearch;
  }, [onSearch])

  const onChange = useCallback((e) => {
    console.log('patter onChange >> ', e.target.value);
    if(inComposition.current){
      value.current = e.target.value;
      return;
    }
    onSearch(e.target.value);
  }, [onSearch])

  useEffect(() => {
    if(searchEl.current){
      console.log('searchEl.current', searchEl.current)
      searchEl.current.input.addEventListener("compositionstart", e => {
        inComposition.current = true;
        // console.log("onSearch compositionstart", e);
      });
      searchEl.current.input.addEventListener("compositionend", e => {
        inComposition.current = false;
        console.log("pattern compositionend", value.current);
        _onSearch.current && _onSearch.current(value.current);
        // onSearch(value.current);

      });
    }
  }, [])


  return (
    <Search
      id="search"
      ref={searchEl}
      placeholder="input search text"
      allowClear
      onChange={onChange}
      style={{ width: 200 }}
      autoFocus={true}
    />
  );
}
