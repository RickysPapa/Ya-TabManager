
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
    "wId": {
      "type": "number",
      "maximum": 9e9
    },
    "title": {
      "type": "string",
      "maxLength": 64,
      default: '未命名'
    },
    "icon": {
      "type": "string",
      "maxLength": 512
    },
    "url": {
      "type": "string",
      "maxLength": 512
    },
    position: {
      type: "number",
      maximum: 999
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
