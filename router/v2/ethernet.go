package v2

import "strings"

func IsEthernet(name string) bool {
	return strings.HasPrefix(name, "en")
}
