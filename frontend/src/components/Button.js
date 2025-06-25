import styled from 'styled-components';

const Button = styled.button`
  background-color: ${props => props.theme.colors.primary};
  color: white;
  padding: 12px 24px;
  border-radius: ${props => props.theme.borderRadius};
  font-size: 16px;
  font-weight: 600;
  transition: opacity 0.2s;
  width: ${props => props.$fullWidth ? '100%' : 'auto'};

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default Button; 