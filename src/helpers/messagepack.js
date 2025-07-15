import { encode as msgpackEncode, decode as msgpackDecode } from "@msgpack/msgpack";

export class MessagePack {
    static encode = msgpackEncode;
    static decode = msgpackDecode;
}