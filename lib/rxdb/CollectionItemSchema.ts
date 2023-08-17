export default {
  "title": "CollectionItems",
  "version": 1,
  "description": "describes a simple hero",
  "primaryKey": "id",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 21
    },
    "cid": {
      "type": "string",
      "maxLength": 21
    },
    "cgid": {
      "type": "string",
      "maxLength": 21,
      default: 'x'
    },
    "type": {
      "type": "string",
      "maxLength": 3
    },
    "title": {
      "type": "string",
      "maxLength": 32
    },
    "tags": {
      "type": "array",
      "maxItems": 5,
      "uniqueItems": true,
      "items": {
        "type": "string",
        maxLength: 10
      }
    },
    "icon": {
      "type": "number",
      "maximum": 3000
    },
    url: {
      "type": "string",
      "maxLength": 1024
    },
    "visits": {
      "type": "number",
      "minimum": 0,
      "maximum": 9999,
      default: 0
    },
    "lastVisit": {
      "type": "number",
      "minimum": 1.68e12,
      "maximum": 2e12,
      // default: Date.now() // 不能使用动态数据，schema 只支持静态 json
    },
    status: {
      type: "number",
      maximum: 10 // type=rl 0未读/1已读
    },
    "cr": {
      "type": "number",
      // "final": true,
      "minimum": 1.68e12,
      "maximum": 2e12,
      // default: Date.now() // 不能使用动态数据，schema 只支持静态 json
    },
  },
  "required": [
    "id",
    "cid",
    "cgid",
    "type",
    "name"
  ],
};
