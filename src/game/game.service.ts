import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TaskGetRequest,
  TaskStartRequest,
  WebcastmateInfoRequest,
} from '@open-dy/open_api_sdk';
import { getAccessToken, getClient, verifySignature } from 'src/utils';

@Injectable()
export class GameService {
  @Inject() private readonly configService: ConfigService;

  // 主播开播后，获取直播间信息
  async startGame(body) {
    const { token } = body;
    if (!token) {
      throw new BadRequestException('token is required');
    }
    const accessToken = await getAccessToken();
    const client = getClient();
    const params = new WebcastmateInfoRequest({
      accessToken,
      token,
    });
    // 调用方法发起请求
    const messageRes = await client.taskStart(params);
    const resData = messageRes?.data?.info;
    // todo: 处理resData
    // https://developer.open-douyin.com/docs/resource/zh-CN/interaction/develop/server/live-room-scope/audience-play/get-live-info
    return resData;
  }

  // 互动 启动任务
  async startTask(msgType: string, roomid: string) {
    const APP_ID = this.configService.get<string>('APP_ID');
    const accessToken = await getAccessToken();
    const client = getClient();
    const params = new TaskStartRequest({
      accessToken,
      appid: APP_ID,
      msgType,
      roomid,
    });
    // 调用方法发起请求
    const messageRes = await client.taskStart(params);
    return messageRes?.data?.task_id;
  }

  // 互动 查询任务状态
  async getTaskStatus(msgType: string, roomid: string) {
    const APP_ID = this.configService.get<string>('APP_ID');
    const accessToken = await getAccessToken();
    const client = getClient();
    const params = new TaskGetRequest({
      accessToken,
      appid: APP_ID,
      msgType,
      roomid,
    });

    // 调用方法发起请求
    const messageRes = await client.taskGet(params);
    return messageRes?.data?.status; // 1 任务不存在 2 任务未启动 3 任务运行中 4 任务已结束
  }

  // 互动 停止任务
  async stopTask(msgType: string, roomid: string) {
    const APP_ID = this.configService.get<string>('APP_ID');
    const accessToken = await getAccessToken();
    const res = await fetch(
      'https://webcast.bytedance.com/api/live_data/task/stop',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'access-token': accessToken,
        },
        body: JSON.stringify({
          appid: APP_ID,
          msg_type: msgType,
          roomid,
        }),
      },
    );
    const messageRes = await res.json();
    // todo: 处理错误
    if (messageRes.err_no !== 0) {
      throw new BadRequestException(messageRes.description);
    }
  }

  async handlePushData(req, body) {
    console.log(req);

    const valid = verifySignature(req);
    if (!valid) {
      throw new BadRequestException('invalid signature');
    }

    // todo: 处理body
    console.log(body);
    // 礼物 test字段为true的情况

    return;
  }
}
