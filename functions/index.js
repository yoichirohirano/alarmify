const functions = require('firebase-functions');
const { CONFIG } = require('./common/CONFIG');
const {
  getGCPAuthorizedClient,
  getUser,
  updateUser,
  getSpotifyAccessToken,
  getUserPlaylists,
  setScheduler,
  playSpotify,
} = require('./common/common');

/**
 * ユーザーのSpotifyプレイリスト一覧を取得する
 */
exports.getPlaylists = functions.https.onCall(async (data, context) => {
  let res = null;
  // 1. OAuthでOAuth2Clientを取得
  const client = await getGCPAuthorizedClient();
  // 2.ユーザ情報取得 from Firestore
  const user = await getUser(client);
  console.log(user);
  // 3. 既存AccessTokenでトライ
  res = await getUserPlaylists(user.access_token).catch(async err => {
    // AccessTokenがexpiredの場合
    const regExp = new RegExp(CONFIG.ERROR[401]);
    if (err.message && regExp.test(err.message)) {
      // 4. 新しいSpotifyのAccessToken取得
      const newSpotifyAccessToken = await getSpotifyAccessToken(user, true);
      // 5. Firestoreに値を保存
      await updateUser({
        user,
        client,
        access_token: newSpotifyAccessToken.access_token,
        refresh_token: newSpotifyAccessToken.refresh_token,
      });
      // 6. 再トライ
      return await getUserPlaylists(newSpotifyAccessToken.access_token);
    }
  });
  return res;
});

/**
 * アラームを設定する
 */
exports.scheduleAlarm = functions.https.onCall(async (data, context) => {
  try {
    // 1. OAuthでOAuth2Clientを取得
    const client = await getGCPAuthorizedClient();
    // 2. ユーザ情報取得 from Firestore
    const user = await getUser(client);
    // 3. 再生するプレイリストを保存
    await updateUser({
      user: user,
      playlistUri: data.playlistUri,
    });
    // 4. cronジョブを設定
    return await setScheduler({
      client,
      hour: data.hour,
      minute: data.minute,
    });
  } catch (error) {
    console.log(`error occurred  ${error}`);
  }
});

/**
 * 接続されたデバイスでSpotifyを再生する
 */
exports.playSpotify = functions
  .region('asia-northeast1')
  .pubsub.topic(CONFIG.JOB_NAME)
  .onPublish(async message => {
    let res = null;
    try {
      // 1. OAuthでOAuth2Clientを取得
      const client = await getGCPAuthorizedClient();
      // 2.ユーザ情報取得 from Firestore
      const user = await getUser(client);
      // 3. 再生を試す
      res = await playSpotify(user.access_token, user.playlistUri);
      // AccessTokenがexpiredの場合
      if (res.status === 401) {
        // 4. 新しいSpotifyのAccessToken取得
        const newSpotifyAccessToken = await getSpotifyAccessToken(user, true);
        // 5. Firestoreに値を保存
        await updateUser({
          user: user,
          access_token: newSpotifyAccessToken.access_token,
          refresh_token: newSpotifyAccessToken.refresh_token,
        });
        // 6. 再生
        res = await playSpotify(
          newSpotifyAccessToken.access_token,
          user.playlistUri,
        );
      }
    } catch (error) {
      console.log(`error occurred  ${err}`);
    }
  });
