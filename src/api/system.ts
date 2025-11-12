import { http } from '@/utils/http'

export type Result = {
  code: number
  message: string
  data?: Array<any> | number | string | object
}

export type ResultTable = {
  code: number
  message: string
  data?: {
    /** 列表数据 */
    items: Array<any>
    /** 总条目数 */
    total?: number
    /** 每页显示条目个数 */
    pageSize?: number
    /** 当前页数 */
    currentPage?: number
  }
}

/** 用户登录 */
export const login = (data: object) => {
  return http<Result>('post', '/user/login', { data })
}

/** 用户登出 */
export const logout = () => {
  return http<Result>('post', '/user/logout')
}

/** 发送邮箱验证码 */
export const sendEmailCode = (email: string) => {
  return http<Result>('get', '/user/sendVerificationCode', {
    params: { email },
  })
}

/** 用户注册 */
export const register = (data: object) => {
  return http<Result>('post', '/user/register', { data })
}

/** 重置密码 */
export const resetPassword = (data: object) => {
  return http<Result>('patch', '/user/resetUserPassword', { data })
}

/** 获取用户信息 */
export const getUserInfo = () => {
  return http<Result>('get', '/user/getUserInfo')
}

/** 更新用户信息 */
export const updateUserInfo = (data: object) => {
  return http<Result>('put', '/user/updateUserInfo', { data })
}

/** 更新用户头像 */
export const updateUserAvatar = (formData: FormData) => {
  return http<Result>('patch', '/user/updateUserAvatar', {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    data: formData,
    transformRequest: [(data) => data], // 防止 axios 处理 FormData
  })
}

/** 注销账号 */
export const deleteUser = () => {
  return http<Result>('delete', '/user/deleteAccount')
}

/** 获取轮播图 */
export const getBanner = () => {
  return http<Result>('get', '/banner/getBannerList')
}

/** 获取推荐歌单 */
export const getRecommendedPlaylists = () => {
  return http<Result>('get', '/playlist/getRecommendedPlaylists')
}

/** 获取推荐歌曲 */
export const getRecommendedSongs = () => {
  return http<Result>('get', '/song/getRecommendedSongs')
}

/** 获取所有歌曲 */
export const getAllSongs = (data: object) => {
  return http<ResultTable>('post', '/song/getAllSongs', { data })
}

/** 获取歌曲详情 */
export const getSongDetail = (id: number) => {
  return http<ResultTable>('get', `/song/getSongDetail/${id}`)
}

/** 获取所有歌手 */
export const getAllArtists = (data: object) => {
  return http<ResultTable>('post', '/artist/getAllArtists', { data })
}

/** 获取歌手详情 */
export const getArtistDetail = (id: number) => {
  return http<Result>('get', `/artist/getArtistDetail/${id}`)
}

/** 获取所有歌单 */
export const getAllPlaylists = (data: object) => {
  return http<ResultTable>('post', '/playlist/getAllPlaylists', { data })
}

/** 获取歌单详情 */
export const getPlaylistDetail = (id: number) => {
  return http<Result>('get', `/playlist/getPlaylistDetail/${id}`)
}

/**
 * 创建歌单（用户主动创建）
 * 对应后端：POST /playlist/create
 */
export const createPlaylist = (data: object) => {
  return http<Result>('post', '/playlist/create', { data })
}

/**
 * 获取歌单总数（可按风格统计）
 * 对应后端：GET /playlist/count
 */
export const getPlaylistsCount = (style?: string) => {
  return http<Result>('get', '/playlist/count', { params: { style } })
}

/**
 * 分页查询歌单列表（管理/筛选用）
 * 对应后端：POST /playlist/list
 */
export const getAllPlaylistsInfo = (data: object) => {
  return http<ResultTable>('post', '/playlist/list', { data })
}

/**
 * 新增歌单（管理端功能，按需使用）
 * 对应后端：POST /playlist/add
 */
export const addPlaylist = (data: object) => {
  return http<Result>('post', '/playlist/add', { data })
}

/**
 * 更新歌单信息（不含封面）
 * 对应后端：PUT /playlist/update
 */
export const updatePlaylist = (data: object) => {
  return http<Result>('put', '/playlist/update', { data })
}

/**
 * 更新歌单封面
 * 对应后端：PATCH /playlist/cover/{id}
 */
export const updatePlaylistCover = (playlistId: number, formData: FormData) => {
  return http<Result>('patch', `/playlist/cover/${playlistId}`, {
    headers: { 'Content-Type': 'multipart/form-data' },
    data: formData,
    transformRequest: [(data) => data],
  })
}

/**
 * 删除单个歌单
 * 对应后端：DELETE /playlist/{id}
 */
export const deletePlaylist = (playlistId: number) => {
  return http<Result>('delete', `/playlist/${playlistId}`)
}

/**
 * 批量删除歌单
 * 对应后端：DELETE /playlist/batch
 */
export const deletePlaylists = (ids: number[]) => {
  return http<Result>('delete', '/playlist/batch', { data: ids })
}

/** 歌曲与歌单绑定：添加歌曲到歌单 */
export const addSongsToPlaylist = (playlistId: number, songIds: number[]) => {
  return http<Result>('post', '/playlist-binding/add-songs', {
    data: { playlistId, songIds },
  })
}

/** 歌曲与歌单绑定：从歌单移除歌曲 */
export const removeSongsFromPlaylist = (playlistId: number, songIds: number[]) => {
  return http<Result>('post', '/playlist-binding/remove-songs', {
    data: { playlistId, songIds },
  })
}

/** 歌曲与歌单绑定：清空歌单 */
export const clearPlaylistSongs = (playlistId: number) => {
  return http<Result>('delete', `/playlist-binding/clear/${playlistId}`)
}

/** 获取用户收藏的歌曲 */
export const getFavoriteSongs = (data: object) => {
  return http<Result>('post', '/favorite/getFavoriteSongs', { data })
}

/** 收藏歌曲 */
export const collectSong = (songId: number) => {
  return http<Result>('post', '/favorite/collectSong', { params: { songId } })
}

/** 取消收藏歌曲 */
export const cancelCollectSong = (songId: number) => {
  return http<Result>('delete', '/favorite/cancelCollectSong', {
    params: { songId },
  })
}

/** 获取用户收藏的歌单 */
export const getFavoritePlaylists = (data: object) => {
  return http<Result>('post', '/favorite/getFavoritePlaylists', { data })
}

/** 收藏歌单 */
export const collectPlaylist = (playlistId: number) => {
  return http<Result>('post', '/favorite/collectPlaylist', {
    params: { playlistId },
  })
}

/** 取消收藏歌单 */
export const cancelCollectPlaylist = (playlistId: number) => {
  return http<Result>('delete', '/favorite/cancelCollectPlaylist', {
    params: { playlistId },
  })
}

/** 新增歌曲评论 */
export const addSongComment = (data: object) => {
  return http<Result>('post', '/comment/addSongComment', { data })
}

/** 新增歌单评论 */
export const addPlaylistComment = (data: object) => {
  return http<Result>('post', '/comment/addPlaylistComment', { data })
}

/** 点赞评论 */
export const likeComment = (commentId: number) => {
  return http<Result>('patch', `/comment/likeComment/${commentId}`)
}

/** 取消点赞评论 */
export const cancelLikeComment = (commentId: number) => {
  return http<Result>('patch', `/comment/cancelLikeComment/${commentId}`)
}

/** 删除评论 */
export const deleteComment = (commentId: number) => {
  return http<Result>('delete', `/comment/deleteComment/${commentId}`)
}

/** 新增反馈 */
export const addFeedback = (data: { content: string }) => {
  return http<Result>('post', '/feedback/addFeedback', { params: data })
}
