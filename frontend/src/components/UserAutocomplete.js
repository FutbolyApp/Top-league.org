import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { searchUsers as searchUsersAPI } from '../api/auth';

const AutocompleteContainer = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #FFA94D;
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
`;

const DropdownItem = styled.div`
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.9rem;
  
  &:hover {
    background: #f8f9fa;
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  ${props => props.$unavailable && `
    opacity: 0.6;
    cursor: not-allowed;
    background: #f8f9fa;
    
    &:hover {
      background: #f8f9fa;
    }
  `}
`;

const UserInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Username = styled.span`
  font-weight: 600;
  color: #333;
`;

const FullName = styled.span`
  color: #666;
  font-size: 0.85rem;
`;

const UnavailableBadge = styled.span`
  background: #dc3545;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
`;

const UserAutocomplete = ({ 
  value, 
  onChange, 
  placeholder, 
  token, 
  legaId, 
  onUserSelect,
  disabled = false 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unavailableUsers, setUnavailableUsers] = useState([]);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (!value || value.length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      if (!token) {
        console.error('Token mancante per la ricerca utenti');
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        console.log('Chiamata API searchUsers con:', { value, legaId, token: token ? 'presente' : 'mancante' });
        const response = await searchUsersAPI(value, legaId, token);
        console.log('Risposta API searchUsers:', response);
        setSuggestions(response?.users || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Errore ricerca utenti:', error);
        console.error('Dettagli errore:', error.message);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [value, legaId, token]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowDropdown(true);
  };

  const handleUserSelect = (user) => {
    onChange(user.username);
    setShowDropdown(false);
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <AutocompleteContainer>
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder={placeholder}
        disabled={disabled}
      />
      
      {showDropdown && (suggestions.length > 0 || loading) && (
        <Dropdown ref={dropdownRef}>
          {loading && (
            <DropdownItem>
              <div style={{ textAlign: 'center', color: '#666' }}>
                Ricerca in corso...
              </div>
            </DropdownItem>
          )}
          
          {!loading && suggestions.length === 0 && value.length >= 2 && (
            <DropdownItem>
              <div style={{ textAlign: 'center', color: '#666' }}>
                Nessun utente trovato
              </div>
            </DropdownItem>
          )}
          
          {!loading && suggestions.map((user) => (
            <DropdownItem 
              key={user.id}
              onClick={() => handleUserSelect(user)}
            >
              <UserInfo>
                <div>
                  <Username>{user.username}</Username>
                  <FullName> - {user.nome} {user.cognome}</FullName>
                </div>
                {user.unavailable && (
                  <UnavailableBadge>Non disponibile</UnavailableBadge>
                )}
              </UserInfo>
            </DropdownItem>
          ))}
        </Dropdown>
      )}
    </AutocompleteContainer>
  );
};

export default UserAutocomplete; 