import styled from 'styled-components';

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: ${props => props.theme.borderRadius};
  font-size: 16px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }

  &::placeholder {
    color: #999;
  }
`;

export default Input; 