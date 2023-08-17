/**
 * TODO 留存窗口历史 防止local数据出问题，数据丢失
 */
export default {
  "title": "TabHistory",
  "version": 2,
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 10
    },
    status: {
      type: "number",
      maximum: 10 // 0未关闭/1已关闭
    },
    "up": {
      "type": "number",
      "minimum": 1.68e12,
      "maximum": 2e12,
    },
    "cr": {
      "type": "number",
      // "final": true,
      "minimum": 1.68e12,
      "maximum": 2e12,
    },
  },
  "required": [
    "id",
    "wId",
    "title",
    "url"
  ],
};
