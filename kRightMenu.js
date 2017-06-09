/**
 * Created by shangkuikui on 2017/6/6.
 */
(function () {
    /**
     * 处理当前dom的对象
     * @type {{}}
     */
    let currentOperateObj = {};
    /**
     * 操作规则
     * @type {{isSending: isSending, isMe: isMe, isSendSucess: isSendSucess, isDownloaded: isDownloaded, isUse: isUse}}
     */
    const OperateRules = {
        isSending: function (tar, operate) {//这一条规则不需要了
            return operate
        },
        isMe: function (tar, operate) {
            if (parseInt($(tar).attr('data-senderid')) === parseInt(myInfo.imUserid)) {
                return operate
            } else {
                return false
            }
        },
        isSendFinish: function (tar, operate) {
            if ($(tar).attr('data-status') == 1) {
                return operate
            } else {
                return false
            }
        },
        isLessTenMinus: function (tar, operate) {
            let tenMinus = 600000;
            if (Math.abs(parseInt($(tar).attr('data-sendtime')) - new Date().getTime()) < tenMinus) {
                return operate
            } else {
                return false
            }
        },
        isDownloaded: function (tar, operate) {
            if ($(tar).find('.icon-wrapper').attr('data-state') == 'finish') {
                return operate
            } else {
                return false
            }
        },
        isUse: function (tar, operate) {
            let path = $(tar).find('.icon-wrapper').attr('data-file-path');
            if (path) {
                return new Promise(resolve => {
                    qFileTransferObj.getFileActiveStates(path, function (data) {
                        //0 ok  -1  被占用  -2 不存在
                        data === 0 ? resolve(operate) : resolve(false);
                    })
                })
            } else {
                return false
            }

        },
        isFileChanged: function (tar, operate) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve(operate)
                }, 500)
            })
        },
        supportPreview: function (tar, operate) {
            let path = $(tar).find('.icon-wrapper').attr('data-file-path');
            let fileType = getFileType(path);
            let arr = ['doc', 'docx', 'xls', 'xlsx', 'pdf', 'txt', 'ppt', 'pptx'];
            if (arr.includes(fileType)) {
                return operate
            } else {
                return false
            }
        }
    }
    /**
     * 文件操作对象
     * @type {{copy: {fn: fn, rules: rules}, delete: {fn: fn, rules: rules}}}
     */
    const fileMsgOperate = {
        name: '文件操作对象',
        msgTypes: [6],
        currentType: '',
        currentDom: {},
        currentFileSize: 0,//todo 等待 后台 确认更改了以后 返回的 size  再赋值
        operates: [
            {
                copy: {
                    name: '复制',
                    fn: () => {
                        console.log(fileMsgOperate.currentDom);
                    },
                    rules: function (tar, operate) {
                        return operate
                    }
                }
            },
            {
                revoke: {
                    name: '撤回',
                    fn: () => {
                        commonRevoke()
                    },
                    rules: function (tar, operate) {
                        return OperateRules.isLessTenMinus(tar, operate)
                            && OperateRules.isSendFinish(tar, operate)
                            && OperateRules.isMe(tar, operate)
                    }
                }
            },
            {
                saveAs: {
                    name: '另存为',
                    fn: () => {
                        //打开窗口

                        //回调路径

                        //触发下载
                        trigFileEv(msgId);
                        console.log(fileMsgOperate.currentDom)
                    },
                    rules: function (tar, operate) {
                        if (OperateRules.isDownloaded(tar, operate)) {
                            return false
                        } else {
                            return operate
                        }
                    }
                }
            },
            {
                sendReturn: {
                    name: '回发',
                    fn: function () {
                        //回发  ,修改后文件大小改变，
                        $('.fileSendReturn').addClass('animateshow');

                    },
                    rules: function (tar, operate) {
                        return OperateRules.isDownloaded(tar, operate)
                            && !OperateRules.isMe(tar, operate)
                            && OperateRules.supportPreview(tar, operate)
                            && OperateRules.isFileChanged(tar, operate);//todo 此处需要返回修改后的文件大小
                    }
                }
            },


            {
                showInFloder: {
                    name: '在文件夹中显示',
                    fn: () => {
                        //打开窗口
                        console.log(fileMsgOperate.currentDom)
                    },
                    rules: function (tar, operate) {
                        return OperateRules.isSendFinish(tar, operate)
                            || OperateRules.isMe(tar, operate)
                    }
                }
            },
            {
                delete: {
                    name: '删除',
                    fn: function () {
                        commonDelete();
                    },
                    rules: function (tar, operate) {
                        return OperateRules.isUse(tar, operate)
                    }
                }
            }
        ],
    };
    /**
     * 一般操作对象
     * @type {{copy: {fn: fn, rules: rules}, delete: {fn: fn, rules: rules}}}
     */
    const generalMsgOperate = {
        name: '一般操作对象',
        currentType: '',
        currentDom: {},
        msgTypes: [1, 100001, 100002, 100003],
        operates: [
            {
                copy: {
                    //复制操作做特殊处理，区分 普通文字和 图片
                    name: '复制',
                    fn: () => {
                        // if (currentOperateObj.currentType == 3) {
                        //document.execCommand("SaveAs");
                        //     console.log('图片消息复制', '等待接口');
                        // } else {
                        console.log('普通消息复制')
                        _documentSelectElement(currentOperateObj.currentDom);
                        document.execCommand("Copy", "false", null);
                        //debugger
                        _showToast({ReturnMsg: '已复制'});
                        // }
                    },
                    rules: function (tar, operate) {
                        return operate
                    }
                }
            },
            {
                revoke: {
                    name: '撤回',
                    fn: () => {
                        commonRevoke();
                    },
                    rules: function (tar, operate) {
                        return OperateRules.isLessTenMinus(tar, operate)
                            && OperateRules.isSendFinish(tar, operate)
                            && OperateRules.isMe(tar, operate)
                    }
                }
            },
            {
                delete: {
                    name: '删除',
                    fn: function () {
                        commonDelete();
                    },
                    rules: function (tar, operate) {
                        return operate
                    }
                }
            }
        ]
    };
    /**
     * 图片操作对象
     * @type {{copy: {fn: fn, rules: rules}, delete: {fn: fn, rules: rules}}}
     */
    const picMsgOperate = {
        name: '图片操作对象',
        currentType: '',
        currentDom: {},
        msgTypes: [3],
        operates: [
            {
                copy: {
                    //复制操作做特殊处理，区分 普通文字和 图片
                    name: '复制',
                    fn: () => {
                        console.log('图片消息复制', '等待接口');

                    },
                    rules: function (tar, operate) {
                        return operate
                    }
                }
            },
            {
                revoke: {
                    name: '撤回',
                    fn: () => {
                        commonRevoke();
                    },
                    rules: function (tar, operate) {
                        return OperateRules.isLessTenMinus(tar, operate)
                            && OperateRules.isSendFinish(tar, operate)
                            && OperateRules.isMe(tar, operate)
                    }
                }
            },
            {
                saveAs: {
                    name: '另存为',
                    fn: () => {
                        let src = $(currentOperateObj.currentDom).find('img').attr('src')
                        console.log('pic另存为:',src)
                    },
                    rules: function (tar, operate) {
                        return operate
                    }
                }
            },
            {
                delete: {
                    name: '删除',
                    fn: function () {
                        commonDelete();
                    },
                    rules: function (tar, operate) {
                        return operate
                    }
                }
            }

        ]
    };
    /**
     * 语音和位置操作对象
     * @type {{copy: {fn: fn, rules: rules}, delete: {fn: fn, rules: rules}}}
     */
    const voiceAndLocationMsgOperate = {
        name: '语音和位置操作对象',
        msgTypes: [2, 5],
        currentType: '',
        currentDom: {},
        operates: [
            {
                revoke: {
                    name: '撤回',
                    fn: () => {
                        commonRevoke();
                    },
                    rules: function (tar, operate) {
                        return OperateRules.isLessTenMinus(tar, operate)
                            && OperateRules.isSendFinish(tar, operate)
                            && OperateRules.isMe(tar, operate)
                    }
                }
            },
            {
                delete: {
                    name: '删除',
                    fn: function () {
                        commonDelete();
                    },
                    rules: function (tar, operate) {
                        return operate
                    }
                }
            }
        ]
    };

    function showRightMenu(tar, e) {
        const type = parseInt($(tar).attr('data-msgtype'));
        if (fileMsgOperate.msgTypes.includes(type)) {
            currentOperateObj = fileMsgOperate;
        }
        else if (voiceAndLocationMsgOperate.msgTypes.includes(type)) {
            currentOperateObj = voiceAndLocationMsgOperate;
        }
        else if (generalMsgOperate.msgTypes.includes(type)) {
            currentOperateObj = generalMsgOperate;
        }
        else if (picMsgOperate.msgTypes.includes(type)) {
            currentOperateObj = picMsgOperate;
        }
        else {
            throw new Error('文件类型不存在:' + type);
        }
        console.log(currentOperateObj);
        currentOperateObj.currentType = type;
        currentOperateObj.currentDom = tar;
        getRightMenu(currentOperateObj, tar, e);
    }

    /**-------------------------------一些工具类和公用方法----------------------------------**/

    /**
     * 公用方法：消息删除
     */
    function commonDelete() {
        //如果当前节点前一个兄弟和后一个兄弟节点都是时间线， 或者 前一个是时间线，后一个是空，也就是最后一条消息 时候，
        if (_preAndNextDomIsTimeLine() || _preDomIsTimeLineAndNextDomIsNull()) {
            let $prev = $(currentOperateObj.currentDom).parent().prev();
            $prev.remove();
        }
        let msgId = $(currentOperateObj.currentDom).parent().attr('id').replace('msg-', '');
        mainObject.deleteMsg(CHATOBJ.groupId, msgId, function (a) {
            console.log('消息删除:', a);
        });
        $(currentOperateObj.currentDom).parent().remove();
        //console.log('消息删除', '等待接口');
    }

    function commonRevoke() {
        let msgId = $(currentOperateObj.currentDom).parent().attr('id').replace('msg-', '');
        //console.log(myInfo)
        RevokeMsgUtil.revoke({
            fromUid: myInfo.imUserid,
            nickName: myInfo.myname,
            GroupId: CHATOBJ.groupId,
            msgId: msgId,
            optTime: '',
            extra: ''
        });
        mainObject.revokeMsg(CHATOBJ.groupId, msgId);
        console.log('普通消息撤回');
    }

    function _preAndNextDomIsTimeLine() {
        let $prev = $(currentOperateObj.currentDom).parent().prev();
        let $next = $(currentOperateObj.currentDom).parent().next();
        return $prev.attr('class') == $next.attr('class') && $next.attr('class') == 'list-time'
    }

    function _preDomIsTimeLineAndNextDomIsNull() {
        let $prev = $(currentOperateObj.currentDom).parent().prev();
        let $next = $(currentOperateObj.currentDom).parent().next();
        return $prev.attr('class') == 'list-time' && !$next.attr('class')
    }

    function _documentSelectElement(element) {
        var sel = window.getSelection();
        var range = document.createRange();
        range.selectNode(element);
        sel.removeAllRanges();
        sel.addRange(range);
    }

    function getRightMenu(currentOperateObj, tar, e) {
        let passedRet = currentOperateObj.operates.filter(operate => {
            Object.keys(operate).forEach(key => {
                return new Promise((resolve, reject) => {
                    resolve(operate[key].rules(tar, operate[key]))
                }).then(passedOperate => {
                    passedOperate && console.log(passedOperate);
                    passedOperate && $('.krightmenu').append($(`<li>${passedOperate.name}</li>`));
                    /*if(passedOperate.name=='在文件夹中显示'){
                     }*/
                }).catch(value => {
                    console.error(value);
                })

            })
        });
        $('.krightmenu').removeClass('hideList').html('').css({
            left: e.pageX + 'px',
            top: e.pageY + 'px'
        });
    }

    function _getSendReturnMsg() {
        let filePath = $(fileMsgOperate.currentDom).find('.icon-wrapper').attr('data-file-path');
        let msgArr = [];
        let safeModule;
        let fileAllName = getFileNameWidthType(filePath);
        let fileType = getFileType(filePath);
        let picpath = getFileThumbnailSrc(fileType);
        if (fileLimitType.includes(fileType.toUpperCase())) {
            safeModule = false
        } else {
            safeModule = true
        }
        if (safeModule === 'false') {
            msgArr.safe = false;
        } else if (fileMsgOperate.currentFileSize > 500 * 1024 * 1024) {
            msgArr.overSize = true;
        }
        let msg = {
            'html': '',
            'msgType': 6,
            'filePath': filePath,
            'msgBody': '你收到一个文件',
            'draft': '[文件]',
            'fileName': '',
            'fileAllName': fileAllName,
            'picPath': picpath,
            'safe': safeModule,
            'size': fileMsgOperate.currentFileSize
        };

        return msgArr.push(msg)
    }

    function _showToast(config) {
        clearTimeout($('.global-toast2').timer);
        var config = config || {};
        var message = config.ReturnMsg || '请求失败';
        var duration = config.duration || 2000;
        if ($('.global-toast2').length === 0) {
            var ele = document.createElement('div');
            ele.className = 'global-toast2 hide';
            ele.innerHTML = '<span><img class="toast-icon" src="../images/icon/warning@2x.png" alt=""></span><span class="toast-body"></span>'
            document.querySelector('.opg').appendChild(ele);
        }
        $('.global-toast2').removeClass('hide');
        $('.global-toast2').find('.toast-body').text(message);
        $('.global-toast2').css({
            'margin-left': document.querySelector('.global-toast2').clientWidth / -2,
            'margin-top': document.querySelector('.global-toast2').clientHeight / -2
        })
        $('.global-toast2').timer = setTimeout(function () {
            $('.global-toast2').addClass('hide');
        }, duration);
    }

    /**
     * 文件回发
     */
    $('.fileSendReturn .cancle').click(() => {
        $('.fileSendReturn').removeClass('animateshow');
    })
    $('.fileSendReturn .confirm').click(() => {
        $('.fileSendReturn').removeClass('animateshow');
        //let msg =_getSendReturnMsg();
        //sendMsg(true,msg);
    })

    $('#msgArea').on('mousedown', '.list-text ', function (e) {
        if (3 == e.which) {
            console.log(this);
            showRightMenu(this, e);
        }
    })
    $('.krightmenu').on('click', 'li', function (e) {
        let name = $(this).html();
        currentOperateObj.operates.forEach(operate => {
            Object.keys(operate).forEach(key => {
                if (operate[key].name === name) {
                    operate[key].fn();
                }
            })
        })
    })

})()