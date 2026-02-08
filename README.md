# LOQUAT - A smart router solution based on Debian GNU/Linux

## Testing

```bash
curl -v -XPOST -d '{"query": "{ version }"}' http://127.0.0.1:8080/graphql
curl -v -XPOST -d '{"query": "mutation { signOut{createdAt} }"}' http://127.0.0.1:8080/graphql
```

## Timer

```bash
systemctl list-timers --all
```

## Documents

- [A Crash Course in Linux Networking](https://datahacker.blog/industry/technology-menu/networking)
- [Linux Networking-concepts HOWTO](https://www.netfilter.org/documentation/HOWTO/networking-concepts-HOWTO.html)
- [Linux Advanced Routing & Traffic Control](https://lartc.org/)
- [nftables](https://wiki.archlinux.org/title/Nftables)
- [QoS in Linux with TC and Filters](http://linux-ip.net/gl/tc-filters/tc-filters.html)
- [Turning a computer into an internet gateway/router.](https://wiki.archlinux.org/title/Router)
- [Advanced traffic control](https://wiki.archlinux.org/title/Advanced_traffic_control)
- [Introduction to modern network load balancing and proxying](https://blog.envoyproxy.io/introduction-to-modern-network-load-balancing-and-proxying-a57f6ff80236)
