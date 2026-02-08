package v2

import "fmt"

func (p *FirewallRule_Time) ToString() string {
	return fmt.Sprintf("%02d:%02d", p.Hour, p.Minute)
}

func NewFirewallRuleTime(s string) (*FirewallRule_Time, error) {
	var minute uint32
	var hour uint32
	if _, err := fmt.Scanf("%02d:%02d", &hour, &minute); err != nil {
		return nil, err
	}
	return &FirewallRule_Time{Hour: hour, Minute: minute}, nil
}
