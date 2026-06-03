# LOQUAT - A smart router solution based on Debian GNU/Linux

## Testing

```bash
curl -v -XPOST -d '{"query": "{ version }"}' http://127.0.0.1:8080/graphql
curl -v -XPOST -d '{"query": "mutation { signOut{createdAt} }"}' http://127.0.0.1:8080/graphql

sudo v4l2-ctl --list-devices
sudo lshw -C video
```

## Timer

```bash
systemctl list-timers --all
```

## Documents

- [A Crash Course in Linux Networking](https://datahacker.blog/industry/technology-menu/networking)
- [Linux Networking-concepts HOWTO](https://www.netfilter.org/documentation/HOWTO/networking-concepts-HOWTO.html)
- [Linux Advanced Routing & Traffic Control](https://lartc.org/)
- [Nftables](https://wiki.archlinux.org/title/Nftables)
- [QoS in Linux with TC and Filters](http://linux-ip.net/gl/tc-filters/tc-filters.html)
- [Turning a computer into an internet gateway/router.](https://wiki.archlinux.org/title/Router)
- [Advanced traffic control](https://wiki.archlinux.org/title/Advanced_traffic_control)
- [Introduction to modern network load balancing and proxying](https://blog.envoyproxy.io/introduction-to-modern-network-load-balancing-and-proxying-a57f6ff80236)
- [Equal Cost Multipath Load Sharing - Hardware ECMP](https://docs.nvidia.com/networking-ethernet-software/cumulus-linux-44/Layer-3/Routing/Equal-Cost-Multipath-Load-Sharing-Hardware-ECMP/)
- [IP Calculator](https://jodies.de/ipcalc)

### Emails

- [GMail](https://developers.google.com/workspace/gmail/imap/imap-smtp#protocol)
- [WeCom](https://open.work.weixin.qq.com/help2/pc/19886#1.General%20configuration%20parameters)
